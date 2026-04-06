import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetPeriod } from './dto/budget.dto';

const mockPrisma = {
  budget: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
};

describe('BudgetsService', () => {
  let service: BudgetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<BudgetsService>(BudgetsService);
    jest.clearAllMocks();
  });

  const mockUser: any = { id: 'user1', email: 'a@b.com', role: 'ANALYST' };

  describe('findAll', () => {
    it('returns user budgets', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([
        { id: 'b1', category: 'Food' },
      ]);
      const result = await service.findAll(mockUser);
      expect(result).toHaveLength(1);
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id },
        }),
      );
    });
  });

  describe('create', () => {
    it('upserts budget for user category', async () => {
      const dto = {
        category: 'Food',
        amount: 500,
        period: BudgetPeriod.MONTHLY,
      };
      mockPrisma.budget.upsert.mockResolvedValue({ id: 'b1', ...dto });

      const result = await service.create(mockUser, dto);
      expect(result.category).toBe('Food');
      expect(mockPrisma.budget.upsert).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes budget if owned by user', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b1',
        userId: 'user1',
      });
      mockPrisma.budget.delete.mockResolvedValue({ id: 'b1' });

      const result = await service.remove(mockUser, 'b1');
      expect(result.id).toBe('b1');
    });

    it('throws NotFoundException if not owned', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b1',
        userId: 'other',
      });
      await expect(service.remove(mockUser, 'b1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
