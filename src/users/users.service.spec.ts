import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns list of users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'a@b.com' },
      ]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
      });
      const result = await service.findOne('u1');
      expect(result.email).toBe('a@b.com');
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates user role and status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', role: 'ADMIN' });

      const result = await service.update('u1', { role: 'ADMIN' as any });
      expect(result.role).toBe('ADMIN');
    });

    it('throws ConflictException if updating to an existing email', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u1', email: 'a@b.com' }) // current user
        .mockResolvedValueOnce({ id: 'u2', email: 'taken@b.com' }); // existing check

      await expect(
        service.update('u1', { email: 'taken@b.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes user if exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.user.delete.mockResolvedValue({ id: 'u1' });

      const result = await service.remove('u1');
      expect(result.id).toBe('u1');
    });

    it('throws NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.remove('u1')).rejects.toThrow(NotFoundException);
    });
  });
});
