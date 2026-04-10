import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListingsService } from './listings.service';

@Controller('api/listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.listingsService.findAll(req.user.id, search);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.listingsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.listingsService.create(req.user.id, body);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.listingsService.update(id, req.user.id, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.listingsService.remove(id, req.user.id);
  }
}
