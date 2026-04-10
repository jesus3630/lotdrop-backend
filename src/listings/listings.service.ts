import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Listing, ListingStatus } from './listing.entity';

@Injectable()
export class ListingsService {
  constructor(@InjectRepository(Listing) private repo: Repository<Listing>) {}

  async findAll(userId: string, search?: string) {
    const where: any = { user: { id: userId } };
    if (search) where.title = Like(`%${search}%`);
    return this.repo.find({
      where,
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const listing = await this.repo.findOne({ where: { id, user: { id: userId } }, relations: ['campaign'] });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async create(userId: string, data: Partial<Listing>) {
    const listing = this.repo.create({ ...data, user: { id: userId } });
    return this.repo.save(listing);
  }

  async update(id: string, userId: string, data: Partial<Listing>) {
    await this.findOne(id, userId);
    await this.repo.update(id, data);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.repo.delete(id);
    return { deleted: true };
  }

  async markPosted(id: string, facebookListingId?: string) {
    await this.repo.update(id, {
      status: ListingStatus.POSTED,
      postedAt: new Date(),
      facebookListingId,
    });
  }

  async markFailed(id: string) {
    await this.repo.update(id, { status: ListingStatus.FAILED });
  }

  findScheduledDue() {
    return this.repo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .where('listing.status = :status', { status: ListingStatus.SCHEDULED })
      .andWhere('listing.scheduledAt <= :now', { now: new Date() })
      .getMany();
  }
}
