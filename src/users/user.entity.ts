import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Listing } from '../listings/listing.entity';
import { Template } from '../templates/template.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  facebookCookie: string;

  @Column({ nullable: true })
  defaultLocation: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Listing, listing => listing.user)
  listings: Listing[];

  @OneToMany(() => Template, template => template.user)
  templates: Template[];

  @OneToMany(() => Campaign, campaign => campaign.user)
  campaigns: Campaign[];
}
