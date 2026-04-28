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
var PosterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const facebook_service_1 = require("./facebook.service");
const listings_service_1 = require("../listings/listings.service");
const users_service_1 = require("../users/users.service");
const listing_entity_1 = require("../listings/listing.entity");
let PosterService = PosterService_1 = class PosterService {
    facebookService;
    listingsService;
    usersService;
    logger = new common_1.Logger(PosterService_1.name);
    activeJobs = new Set();
    constructor(facebookService, listingsService, usersService) {
        this.facebookService = facebookService;
        this.listingsService = listingsService;
        this.usersService = usersService;
    }
    async processScheduledListings() {
        this.logger.log('Checking for scheduled listings...');
        const dueListing = await this.listingsService.findScheduledDue();
        for (const listing of dueListing) {
            if (this.activeJobs.has(listing.id))
                continue;
            this.postListing(listing.id, listing.user.id).catch(err => this.logger.error(`Failed to post listing ${listing.id}: ${err.message}`));
        }
    }
    async postListing(listingId, userId) {
        if (this.activeJobs.has(listingId)) {
            return { success: false, error: 'Already posting this listing' };
        }
        this.activeJobs.add(listingId);
        try {
            const listing = await this.listingsService.findOne(listingId, userId);
            const user = await this.usersService.findById(userId);
            if (!user?.facebookCookie) {
                return { success: false, error: 'No Facebook cookie set. Go to Settings to add your Facebook cookie.' };
            }
            if (!listing.platforms?.includes('facebook')) {
                return { success: false, error: 'Facebook not selected as a platform for this listing.' };
            }
            this.logger.log(`Posting listing "${listing.title}" to Facebook...`);
            const url = await this.facebookService.postListing({
                title: listing.title,
                price: listing.price,
                description: listing.description || '',
                location: listing.location || user.defaultLocation || '',
                condition: listing.condition,
                listingType: listing.listingType,
                images: listing.images || [],
                facebookCookie: user.facebookCookie,
                year: listing.year,
                make: listing.make,
                model: listing.model,
                mileage: listing.mileage,
                exteriorColor: listing.exteriorColor,
                transmission: listing.transmission,
            });
            await this.listingsService.markPosted(listingId, url);
            this.logger.log(`Successfully posted listing "${listing.title}"`);
            return { success: true, url };
        }
        catch (err) {
            await this.listingsService.markFailed(listingId);
            return { success: false, error: err.message };
        }
        finally {
            this.activeJobs.delete(listingId);
        }
    }
    async scheduleListingAt(listingId, userId, scheduledAt) {
        await this.listingsService.update(listingId, userId, {
            status: listing_entity_1.ListingStatus.SCHEDULED,
            scheduledAt,
        });
        return { scheduled: true, at: scheduledAt };
    }
};
exports.PosterService = PosterService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PosterService.prototype, "processScheduledListings", null);
exports.PosterService = PosterService = PosterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [facebook_service_1.FacebookService,
        listings_service_1.ListingsService,
        users_service_1.UsersService])
], PosterService);
//# sourceMappingURL=poster.service.js.map