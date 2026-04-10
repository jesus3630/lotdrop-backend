import { User } from '../users/user.entity';
export declare class Template {
    id: string;
    name: string;
    title: string;
    price: number;
    listingType: string;
    platforms: string[];
    condition: string;
    description: string;
    location: string;
    createdAt: Date;
    user: User;
}
