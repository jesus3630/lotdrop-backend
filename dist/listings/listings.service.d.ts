import { Repository } from 'typeorm';
import { Listing } from './listing.entity';
export declare class ListingsService {
    private repo;
    constructor(repo: Repository<Listing>);
    findAll(userId: string, search?: string): Promise<Listing[]>;
    findOne(id: string, userId: string): Promise<Listing>;
    create(userId: string, data: Partial<Listing>): Promise<Listing>;
    update(id: string, userId: string, data: Partial<Listing>): Promise<Listing>;
    remove(id: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    markPosted(id: string, facebookListingId?: string): Promise<void>;
    markFailed(id: string): Promise<void>;
    findScheduledDue(): Promise<Listing[]>;
}
