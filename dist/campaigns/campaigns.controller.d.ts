import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(req: any): Promise<import("./campaign.entity").Campaign[]>;
    findOne(req: any, id: string): Promise<import("./campaign.entity").Campaign>;
    create(req: any, body: any): Promise<import("./campaign.entity").Campaign>;
    update(req: any, id: string, body: any): Promise<import("./campaign.entity").Campaign>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
