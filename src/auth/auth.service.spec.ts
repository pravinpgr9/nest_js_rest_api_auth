import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService, // ✅ Mock PrismaService
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService, // ✅ Mock JwtService
          useValue: { sign: jest.fn().mockReturnValue('mocked_token') },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should register a new user', async () => {
    const hashedPassword = await bcrypt.hash('password', 10);

    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User', // ✅ Ensure name is included
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10), // ✅ This will be excluded in response
    };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

    const result = await authService.register({
      name: 'Test User', // ✅ Ensure name is passed
      email: 'test@example.com',
      password: 'password',
    });

    expect(result).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User', // ✅ Ensure name is in the expected output
      email: 'test@example.com',
    });
  });

  it('should return access_token on successful login', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10);

    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User', // ✅ Ensure name is included
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10), // ✅ This will be excluded in response

    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    jest.spyOn(jwtService, 'sign').mockReturnValue('mocked_token');

    const result = await authService.login({
      email: 'test@example.com',
      password: 'correctpassword',
    });

    expect(result).toEqual({ access_token: 'mocked_token' });
  });
});
