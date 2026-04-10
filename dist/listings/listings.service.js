"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const listing_entity_1 = require("./listing.entity");
let ListingsService = class ListingsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(userId, search) {
        const where = { user: { id: userId } };
        if (search)
            where.title = (0, typeorm_2.Like)(`%${search}%`);
        return this.repo.find({
            where,
            relations: ['campaign'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const listing = await this.repo.findOne({ where: { id, user: { id: userId } }, relations: ['campaign'] });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        return listing;
    }
    async create(userId, data) {
        const listing = this.repo.create({ ...data, user: { id: userId } });
        return this.repo.save(listing);
    }
    async update(id, userId, data) {
        await this.findOne(id, userId);
        await this.repo.update(id, data);
        return this.findOne(id, userId);
    }
    async remove(id, userId) {
        await this.findOne(id, userId);
        await this.repo.delete(id);
        return { deleted: true };
    }
    async markPosted(id, facebookListingId) {
        await this.repo.update(id, {
            status: listing_entity_1.ListingStatus.POSTED,
            postedAt: new Date(),
            facebookListingId,
        });
    }
    async markFailed(id) {
        await this.repo.update(id, { status: listing_entity_1.ListingStatus.FAILED });
    }
    findScheduledDue() {
        return this.repo
            .createQueryBuilder('listing')
            .leftJoinAndSelect('listing.user', 'user')
            .where('listing.status = :status', { status: listing_entity_1.ListingStatus.SCHEDULED })
            .andWhere('listing.scheduledAt <= :now', { now: new Date() })
            .getMany();
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(listing_entity_1.Listing)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ListingsService);
//# sourceMappingURL=listings.service.js.map