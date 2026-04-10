import { Listing } from '../listings/listing.entity';
import { Template } from '../templates/template.entity';
import { Campaign } from '../campaigns/campaign.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    facebookCookie: string;
    defaultLocation: string;
    role: string;
    createdAt: Date;
    listings: Listing[];
    templates: Template[];
    campaigns: Campaign[];
}
