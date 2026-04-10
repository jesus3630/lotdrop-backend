import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';

@Injectable()
export class TemplatesService {
  constructor(@InjectRepository(Template) private repo: Repository<Template>) {}

  findAll(userId: string) {
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string) {
    const t = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  create(userId: string, data: Partial<Template>) {
    const t = this.repo.create({ ...data, user: { id: userId } });
    return this.repo.save(t);
  }

  async update(id: string, userId: string, data: Partial<Template>) {
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
