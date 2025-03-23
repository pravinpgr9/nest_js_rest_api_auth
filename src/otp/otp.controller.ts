import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('auth')
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post('send-otp')
  async sendOtp(@Body('mobile') mobile: string) {
    return this.otpService.generateOtp(mobile);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() { mobile, otp }: { mobile: string; otp: string }) {
    return this.otpService.verifyOtp(mobile, otp);
  }
}
