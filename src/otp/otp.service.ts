import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  async generateOtp(mobile: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const otp = randomInt(100000, 999999).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5); // OTP expires in 5 minutes

    // Store OTP in OTP table
    await this.prisma.otp.create({
      data: { userId: user.id, otp, expiresAt: expiry },
    });

    // Send OTP via SMS (Mock API or Twilio)
    await this.sendSms(mobile, `Your OTP is: ${otp}`);

    return { message: 'OTP sent successfully', mobile };
  }

  async verifyOtp(mobile: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const storedOtp = await this.prisma.otp.findFirst({
      where: { userId: user.id, otp },
      orderBy: { createdAt: 'desc' },
    });

    if (!storedOtp || new Date() > storedOtp.expiresAt) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    // Delete OTP after verification
    await this.prisma.otp.delete({ where: { id: storedOtp.id } });

    return { message: 'OTP verified successfully', userId: user.id };
  }

  async sendSms(to: string, message: string) {
    console.log(`Sending SMS to ${to}: ${message}`);
    // Implement Twilio or Fast2SMS here
  }
}
