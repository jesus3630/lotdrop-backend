import { User } from '../users/user.entity';
import { Campaign } from '../campaigns/campaign.entity';
export declare enum ListingType {
    ITEM = "item",
    HOUSING = "housing",
    VEHICLE = "vehicle"
}
export declare enum ListingStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    POSTED = "posted",
    FAILED = "failed",
    EXPIRED = "expired"
}
export declare enum Condition {
    NEW = "New",
    USED_LIKE_NEW = "Used - Like New",
    USED_GOOD = "Used - Good",
    USED_FAIR = "Used - Fair"
}
export declare class Listing {
    id: string;
    title: string;
    price: number;
    listingType: ListingType;
    platforms: string[];
    images: string[];
    condition: Condition;
    description: string;
    location: string;
    status: ListingStatus;
    scheduledAt: Date;
    postedAt: Date;
    facebookListingId: string;
    year: number;
    make: string;
    model: string;
    mileage: number;
    exteriorColor: string;
    transmission: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    campaign: Campaign;
}
