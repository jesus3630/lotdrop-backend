import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@Controller('api/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll(@Request() req) {
    return this.templatesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.templatesService.findOne(id, req.user.id);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.templatesService.create(req.user.id, body);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.templatesService.update(id, req.user.id, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.templatesService.remove(id, req.user.id);
  }
}
