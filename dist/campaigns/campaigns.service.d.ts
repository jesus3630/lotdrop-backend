import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
export declare class CampaignsService {
    private repo;
    constructor(repo: Repository<Campaign>);
    findAll(userId: string): Promise<Campaign[]>;
    findOne(id: string, userId: string): Promise<Campaign>;
    create(userId: string, data: Partial<Campaign>): Promise<Campaign>;
    update(id: string, userId: string, data: Partial<Campaign>): Promise<Campaign>;
    remove(id: string, userId: string): Promise<{
        deleted: boolean;
    }>;
}
