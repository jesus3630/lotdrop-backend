import { PosterService } from './poster.service';
export declare class PosterController {
    private posterService;
    constructor(posterService: PosterService);
    postNow(req: any, listingId: string): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }>;
    schedule(req: any, listingId: string, body: {
        scheduledAt: string;
    }): Promise<{
        scheduled: boolean;
        at: Date;
    }>;
}
