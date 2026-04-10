import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(@InjectRepository(Campaign) private repo: Repository<Campaign>) {}

  findAll(userId: string) {
    return this.repo.find({ where: { user: { id: userId } }, relations: ['listings'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string) {
    const c = await this.repo.findOne({ where: { id, user: { id: userId } }, relations: ['listings'] });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  create(userId: string, data: Partial<Campaign>) {
    const c = this.repo.create({ ...data, user: { id: userId } });
    return this.repo.save(c);
  }

  async update(id: string, userId: string, data: Partial<Campaign>) {
    await this.findOne(id, userId);
    await this.repo.update(id, data);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
