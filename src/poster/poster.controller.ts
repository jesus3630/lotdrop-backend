import { Controller, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PosterService } from './poster.service';

@Controller('api/poster')
@UseGuards(JwtAuthGuard)
export class PosterController {
  constructor(private posterService: PosterService) {}

  // Manually trigger posting a listing to Facebook now
  @Post('post/:listingId')
  postNow(@Request() req, @Param('listingId') listingId: string) {
    return this.posterService.postListing(listingId, req.user.id);
  }

  // Schedule a listing to post at a specific time
  @Post('schedule/:listingId')
  schedule(
    @Request() req,
    @Param('listingId') listingId: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.posterService.scheduleListingAt(
      listingId,
      req.user.id,
      new Date(body.scheduledAt),
    );
  }
}
