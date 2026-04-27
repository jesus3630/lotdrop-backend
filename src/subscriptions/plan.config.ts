export type PlanId = 'free' | 'starter' | 'pro';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number; // USD cents
  priceYearly: number;  // USD cents  (billed annually)
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  limits: {
    listingsPerMonth: number | null; // null = unlimited
    activeCampaigns: number | null;
    platforms: number;
    templatesMax: number | null;
  };
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with the basics — no credit card required.',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      listingsPerMonth: 10,
      activeCampaigns: 1,
      platforms: 1,
      templatesMax: 3,
    },
    features: [
      '10 listings / month',
      '1 active campaign',
      '1 platform (Facebook Marketplace)',
      '3 saved templates',
      'Basic support',
    ],
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for side-hustlers who need more volume.',
    priceMonthly: 1900,  // $19 / mo
    priceYearly: 15200,  // $152 / yr  (~$12.67/mo, 33% off)
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? null,
    limits: {
      listingsPerMonth: 100,
      activeCampaigns: 5,
      platforms: 2,
      templatesMax: 20,
    },
    features: [
      '100 listings / month',
      '5 active campaigns',
      '2 platforms',
      '20 saved templates',
      'Scheduled posting',
      'Email support',
    ],
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For power sellers and small dealerships — unlimited everything.',
    priceMonthly: 4900,  // $49 / mo
    priceYearly: 39200,  // $392 / yr  (~$32.67/mo, 33% off)
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    limits: {
      listingsPerMonth: null,
      activeCampaigns: null,
      platforms: 3,
      templatesMax: null,
    },
    features: [
      'Unlimited listings',
      'Unlimited campaigns',
      'All platforms',
      'Unlimited templates',
      'Scheduled posting',
      'Priority support',
      'Early access to new features',
    ],
  },
};
