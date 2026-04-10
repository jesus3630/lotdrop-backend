import { FacebookService } from './facebook.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';
export declare class PosterService {
    private facebookService;
    private listingsService;
    private usersService;
    private readonly logger;
    private activeJobs;
    constructor(facebookService: FacebookService, listingsService: ListingsService, usersService: UsersService);
    processScheduledListings(): Promise<void>;
    postListing(listingId: string, userId: string): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }>;
    scheduleListingAt(listingId: string, userId: string, scheduledAt: Date): Promise<{
        scheduled: boolean;
        at: Date;
    }>;
}
