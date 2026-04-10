import { User } from '../users/user.entity';
import { Listing } from '../listings/listing.entity';
export declare class Campaign {
    id: string;
    name: string;
    description: string;
    scheduleInterval: string;
    isActive: boolean;
    createdAt: Date;
    user: User;
    listings: Listing[];
}
