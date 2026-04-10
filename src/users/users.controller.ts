import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@Request() req) {
    const { password, ...user } = req.user;
    return user;
  }

  @Patch('me')
  updateMe(@Request() req, @Body() body: { name?: string; defaultLocation?: string; facebookCookie?: string }) {
    return this.usersService.update(req.user.id, body);
  }
}
