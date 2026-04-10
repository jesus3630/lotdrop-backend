import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Campaign } from '../campaigns/campaign.entity';

export enum ListingType {
  ITEM = 'item',
  HOUSING = 'housing',
  VEHICLE = 'vehicle',
}

export enum ListingStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  POSTED = 'posted',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum Condition {
  NEW = 'New',
  USED_LIKE_NEW = 'Used - Like New',
  USED_GOOD = 'Used - Good',
  USED_FAIR = 'Used - Fair',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ListingType, default: ListingType.VEHICLE })
  listingType: ListingType;

  @Column('simple-array', { nullable: true })
  platforms: string[];

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'enum', enum: Condition, default: Condition.USED_GOOD })
  condition: Condition;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.DRAFT })
  status: ListingStatus;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  postedAt: Date;

  @Column({ nullable: true })
  facebookListingId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.listings)
  user: User;

  @ManyToOne(() => Campaign, campaign => campaign.listings, { nullable: true })
  campaign: Campaign;
}
