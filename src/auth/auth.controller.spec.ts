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
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mocked_token') },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should register a new user', async () => {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10),
    };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
    });

    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
    }); // ✅ Exclude the password from expectation
  });
});
