import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { BillingInterval } from './subscription.entity';
import type { PlanId } from './plan.config';

// ─── DTOs ────────────────────────────────────────────────────────────────────

class CreateCheckoutDto {
  planId: PlanId;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

class CreatePortalDto {
  returnUrl: string;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** Public — returns the plan catalogue for the pricing page. */
  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  /** Auth-required — returns the current user's active subscription + plan. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMySubscription(@Request() req) {
    return this.subscriptionsService.getForUser(req.user.id);
  }

  /**
   * Auth-required — initiates a Stripe Checkout session.
   * Returns { url } that the frontend should redirect to.
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(@Request() req, @Body() body: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckoutSession(
      req.user.id,
      body.planId,
      body.billingInterval,
      body.successUrl,
      body.cancelUrl,
    );
  }

  /**
   * Auth-required — opens Stripe Billing Portal so the user can
   * manage/cancel their subscription directly.
   * Returns { url } for the frontend to redirect to.
   */
  @UseGuards(JwtAuthGuard)
  @Post('portal')
  createPortal(@Request() req, @Body() body: CreatePortalDto) {
    return this.subscriptionsService.createPortalSession(req.user.id, body.returnUrl);
  }

  /**
   * Stripe webhook — receives raw body so the signature can be verified.
   * Must be excluded from any global body-parser JSON middleware.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.subscriptionsService.handleStripeWebhook(
      req.rawBody as Buffer,
      signature,
    );
    return { received: true };
  }
}
