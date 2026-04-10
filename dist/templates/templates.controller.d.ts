import { TemplatesService } from './templates.service';
export declare class TemplatesController {
    private templatesService;
    constructor(templatesService: TemplatesService);
    findAll(req: any): Promise<import("./template.entity").Template[]>;
    findOne(req: any, id: string): Promise<import("./template.entity").Template>;
    create(req: any, body: any): Promise<import("./template.entity").Template>;
    update(req: any, id: string, body: any): Promise<import("./template.entity").Template>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
