import { ListingsService } from './listings.service';
export declare class ListingsController {
    private listingsService;
    constructor(listingsService: ListingsService);
    findAll(req: any, search?: string): Promise<import("./listing.entity").Listing[]>;
    findOne(req: any, id: string): Promise<import("./listing.entity").Listing>;
    create(req: any, body: any): Promise<import("./listing.entity").Listing>;
    update(req: any, id: string, body: any): Promise<import("./listing.entity").Listing>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
