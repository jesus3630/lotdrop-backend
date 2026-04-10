import { Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { PosterService } from './poster.service';
import { PosterController } from './poster.controller';
import { ListingsModule } from '../listings/listings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ListingsModule, UsersModule],
  providers: [FacebookService, PosterService],
  controllers: [PosterController],
  exports: [PosterService],
})
export class PosterModule {}
