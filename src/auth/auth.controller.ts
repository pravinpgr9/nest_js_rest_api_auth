import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() data: { name: string; email: string; mobile: string; password: string }) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: { email?: string; mobile?: string; password: string }) {
    return this.authService.login(data);
  }
}
