import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription, SubscriptionStatus, BillingInterval } from './subscription.entity';
import { PLANS, PlanId } from './plan.config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription) private repo: Repository<Subscription>,
    private config: ConfigService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the public plan catalogue (no Stripe IDs exposed). */
  getPlans() {
    return Object.values(PLANS).map(({ stripePriceIdMonthly: _m, stripePriceIdYearly: _y, ...rest }) => rest);
  }

  /** Find-or-create a subscription row for a user (defaults to free). */
  async findOrCreate(userId: string): Promise<Subscription> {
    let sub = await this.repo.findOne({ where: { userId } });
    if (!sub) {
      sub = this.repo.create({ userId, planId: 'free', status: SubscriptionStatus.ACTIVE });
      sub = await this.repo.save(sub);
    }
    return sub;
  }

  /** Get current subscription for a user (creates free tier if missing). */
  async getForUser(userId: string) {
    const sub = await this.findOrCreate(userId);
    const plan = PLANS[sub.planId];
    return { subscription: sub, plan };
  }

  // ─── Checkout ───────────────────────────────────────────────────────────────

  /**
   * Creates a Stripe Checkout Session URL for the requested plan.
   * Returns the URL the frontend should redirect to.
   *
   * NOTE: This method is Stripe-ready. The actual Stripe SDK call is behind
   * a guard so the app runs without Stripe keys in local/dev environments.
   */
  async createCheckoutSession(
    userId: string,
    planId: PlanId,
    billingInterval: BillingInterval,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    const plan = PLANS[planId];
    if (!plan) throw new BadRequestException(`Unknown plan: ${planId}`);
    if (planId === 'free') throw new BadRequestException('Cannot checkout the Free plan');

    const priceId =
      billingInterval === BillingInterval.YEARLY
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BadRequestException(
        'Stripe is not configured for this environment. Set STRIPE_PRICE_* env vars.',
      );
    }

    const stripeSecretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured.');
    }

    // Lazy-load stripe so the module boots without a key in dev
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30' });

    let sub = await this.findOrCreate(userId);

    // Reuse or create a Stripe customer
    let customerId = sub.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
      await this.repo.update(sub.id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, planId, billingInterval },
      subscription_data: { metadata: { userId, planId, billingInterval } },
    });

    return { url: session.url as string };
  }

  // ─── Billing portal ──────────────────────────────────────────────────────────

  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    const sub = await this.findOrCreate(userId);

    if (!sub.stripeCustomerId) {
      throw new BadRequestException('No billing account found. Please subscribe first.');
    }

    const stripeSecretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) throw new BadRequestException('STRIPE_SECRET_KEY is not configured.');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30' });

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url as string };
  }

  // ─── Webhook ─────────────────────────────────────────────────────────────────

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    const stripeSecretKey = this.config.get<string>('STRIPE_SECRET_KEY');

    if (!webhookSecret || !stripeSecretKey) {
      this.logger.warn('Stripe webhook received but keys are not configured — skipping.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30' });

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    await this.processStripeEvent(event);
  }

  private async processStripeEvent(event: any): Promise<void> {
    const { type, data } = event;

    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        const { userId, planId, billingInterval } = session.metadata ?? {};
        if (!userId || !planId) break;

        const periodEnd = session.subscription
          ? await this.getSubscriptionPeriodEnd(session.subscription, event)
          : null;

        await this.upsertSubscription(userId, {
          planId,
          billingInterval: billingInterval ?? BillingInterval.MONTHLY,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: session.subscription ?? null,
          stripeCustomerId: session.customer ?? null,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
        });
        this.logger.log(`Activated plan "${planId}" for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = data.object;
        const { userId, planId, billingInterval } = stripeSub.metadata ?? {};
        if (!userId) break;

        await this.upsertSubscription(userId, {
          planId: planId ?? 'free',
          billingInterval: billingInterval ?? BillingInterval.MONTHLY,
          status: this.mapStripeStatus(stripeSub.status),
          stripeSubscriptionId: stripeSub.id,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
        });
        this.logger.log(`Updated subscription for user ${userId} → status: ${stripeSub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = data.object;
        const { userId } = stripeSub.metadata ?? {};
        if (!userId) break;

        await this.upsertSubscription(userId, {
          planId: 'free',
          billingInterval: BillingInterval.MONTHLY,
          status: SubscriptionStatus.CANCELED,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          canceledAt: new Date(),
        });
        this.logger.log(`Subscription cancelled for user ${userId} — downgraded to Free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = data.object;
        const customerId = invoice.customer;
        await this.repo.update({ stripeCustomerId: customerId }, { status: SubscriptionStatus.PAST_DUE });
        this.logger.warn(`Payment failed for Stripe customer ${customerId}`);
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${type}`);
    }
  }

  private async getSubscriptionPeriodEnd(subscriptionId: string, event: any): Promise<Date | null> {
    try {
      // The expanded subscription is sometimes on the event already
      const expanded = event?.data?.object?.subscription_details ?? null;
      if (expanded?.current_period_end) {
        return new Date(expanded.current_period_end * 1000);
      }
    } catch {
      // ignore
    }
    return null;
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      trialing: SubscriptionStatus.TRIALING,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.PAST_DUE,
    };
    return map[stripeStatus] ?? SubscriptionStatus.INCOMPLETE;
  }

  private async upsertSubscription(userId: string, data: Partial<Subscription>): Promise<void> {
    const sub = await this.findOrCreate(userId);
    await this.repo.update(sub.id, data);
  }

  // ─── Plan enforcement helpers ────────────────────────────────────────────────

  /** Returns the active plan limits for a user — use this in other services. */
  async getLimitsForUser(userId: string) {
    const { plan } = await this.getForUser(userId);
    return plan.limits;
  }

  /** Check whether a user is allowed to create more listings this month. */
  async canCreateListing(userId: string, currentMonthCount: number): Promise<boolean> {
    const limits = await this.getLimitsForUser(userId);
    if (limits.listingsPerMonth === null) return true;
    return currentMonthCount < limits.listingsPerMonth;
  }

  /** Check whether a user can create another campaign. */
  async canCreateCampaign(userId: string, activeCampaignCount: number): Promise<boolean> {
    const limits = await this.getLimitsForUser(userId);
    if (limits.activeCampaigns === null) return true;
    return activeCampaignCount < limits.activeCampaigns;
  }
}
