import { Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import type { AuthRequest } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local')) 
  @Post('login')
  @HttpCode(200)
  login(@Req() req: AuthRequest) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  profile(@Req() req: AuthRequest) {
    return this.authService.profile(req.user);
  }
}
