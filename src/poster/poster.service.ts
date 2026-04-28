import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FacebookService } from './facebook.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';
import { ListingStatus } from '../listings/listing.entity';

@Injectable()
export class PosterService {
  private readonly logger = new Logger(PosterService.name);
  private activeJobs = new Set<string>();

  constructor(
    private facebookService: FacebookService,
    private listingsService: ListingsService,
    private usersService: UsersService,
  ) {}

  // Check every 5 minutes for scheduled listings due to post
  @Cron('*/5 * * * *')
  async processScheduledListings() {
    this.logger.log('Checking for scheduled listings...');
    const dueListing = await this.listingsService.findScheduledDue();
    for (const listing of dueListing) {
      if (this.activeJobs.has(listing.id)) continue;
      this.postListing(listing.id, listing.user.id).catch(err =>
        this.logger.error(`Failed to post listing ${listing.id}: ${err.message}`)
      );
    }
  }

  async postListing(listingId: string, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
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

    } catch (err) {
      await this.listingsService.markFailed(listingId);
      return { success: false, error: err.message };
    } finally {
      this.activeJobs.delete(listingId);
    }
  }

  async scheduleListingAt(listingId: string, userId: string, scheduledAt: Date) {
    await this.listingsService.update(listingId, userId, {
      status: ListingStatus.SCHEDULED,
      scheduledAt,
    });
    return { scheduled: true, at: scheduledAt };
  }
}
