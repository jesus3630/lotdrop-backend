import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: any): any;
    updateMe(req: any, body: {
        name?: string;
        defaultLocation?: string;
        facebookCookie?: string;
    }): Promise<import("typeorm").UpdateResult>;
}
