import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import type { PlanId } from './plan.config';

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ default: 'free' })
  planId: PlanId;

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  /** Stripe customer ID — populated once a paid checkout is initiated */
  @Column({ type: 'varchar', nullable: true })
  stripeCustomerId: string | null;

  /** Stripe subscription ID — populated after a successful checkout */
  @Column({ type: 'varchar', nullable: true })
  stripeSubscriptionId: string | null;

  /** Current period end — when the subscription renews or expires */
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null;

  /** When the user cancelled (null = not cancelled) */
  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
