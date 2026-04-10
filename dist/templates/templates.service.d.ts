import { Repository } from 'typeorm';
import { Template } from './template.entity';
export declare class TemplatesService {
    private repo;
    constructor(repo: Repository<Template>);
    findAll(userId: string): Promise<Template[]>;
    findOne(id: string, userId: string): Promise<Template>;
    create(userId: string, data: Partial<Template>): Promise<Template>;
    update(id: string, userId: string, data: Partial<Template>): Promise<Template>;
    remove(id: string, userId: string): Promise<{
        deleted: boolean;
    }>;
}
