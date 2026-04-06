import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('test-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // --- register ---
  describe('register', () => {
    it('creates user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        role: 'VIEWER',
        createdAt: new Date(),
      });
      const result = await service.register({
        email: 'a@b.com',
        password: 'pass1234',
      });
      expect(result.email).toBe('a@b.com');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(
        service.register({ email: 'a@b.com', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // --- login ---
  describe('login', () => {
    it('returns accessToken on valid credentials', async () => {
      const hashed = await bcrypt.hash('pass1234', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hashed,
        role: 'VIEWER',
        status: 'ACTIVE',
      });
      const result = await service.login({
        email: 'a@b.com',
        password: 'pass1234',
      });
      expect(result.accessToken).toBe('test-token');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hashed,
        status: 'ACTIVE',
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive account', async () => {
      const hashed = await bcrypt.hash('pass1234', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hashed,
        status: 'INACTIVE',
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'pass1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
