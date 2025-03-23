import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; mobile: string; password: string }) {
    // ✅ Validate input fields
    if (!data.name || !data.email || !data.mobile || !data.password) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Validation Error',
        errors: {
          name: !data.name ? 'Name is required' : undefined,
          email: !data.email ? 'Email is required' : undefined,
          mobile: !data.mobile ? 'Mobile number is required' : undefined,
          password: !data.password ? 'Password is required' : undefined,
        },
      });
    }

    // ✅ Check if email or mobile is already registered
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { mobile: data.mobile }],
      },
    });

    if (existingUser) {
      throw new ConflictException({
        success: false,
        statusCode: 409,
        message: 'Registration Failed',
        errors: {
          email: existingUser.email === data.email ? 'This email is already registered.' : undefined,
          mobile: existingUser.mobile === data.mobile ? 'This mobile number is already registered.' : undefined,
        },
      });
    }

    // ✅ Hash password securely
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      // ✅ Create user
      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          password: hashedPassword,
        },
      });

      // ✅ Exclude password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        statusCode: 201,
        message: 'User registration successful',
        data: {
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'An error occurred during registration. Please try again later.',
        errorDetails: error.message,
      });
    }
  }

  async login(loginDto: { email?: string; mobile?: string; password: string }) {
    // ✅ Validate input fields
    if ((!loginDto.email && !loginDto.mobile) || !loginDto.password) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Validation Error',
        errors: {
          email: !loginDto.email && !loginDto.mobile ? 'Email or Mobile number is required' : undefined,
          password: !loginDto.password ? 'Password is required' : undefined,
        },
      });
    }

    // ✅ Find user in DB (by email OR mobile)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: loginDto.email }, { mobile: loginDto.mobile }],
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Authentication Failed',
        errors: {
          account: 'No account found with this email or mobile number.',
        },
      });
    }

    // ✅ Compare password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Authentication Failed',
        errors: {
          password: 'Incorrect password. Please try again.',
        },
      });
    }

    // ✅ Generate JWT Token
    const token = this.jwtService.sign({ userId: user.id, email: user.email, mobile: user.mobile });

    return {
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        },
      },
    };
  }
}
