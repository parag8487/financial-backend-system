import { Test, TestingModule } from '@nestjs/testing';
import { Role, RecordType } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

const makeRecord = (
  type: RecordType,
  amount: number,
  category: string,
  date: Date,
) => ({
  amount,
  type,
  category,
  date,
});

const mockPrisma = {
  financialRecord: {
    findMany: jest.fn(),
  },
};

const mockUser: AuthUser = {
  id: 'u1',
  email: 'test@finance.com',
  role: Role.ANALYST,
};
const adminUser: AuthUser = {
  id: 'admin1',
  email: 'admin@finance.com',
  role: Role.ADMIN,
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('calculates correct totals', async () => {
      mockPrisma.financialRecord.findMany.mockResolvedValue([
        makeRecord(RecordType.INCOME, 1000, 'Salary', new Date()),
        makeRecord(RecordType.INCOME, 500, 'Freelance', new Date()),
        makeRecord(RecordType.EXPENSE, 300, 'Rent', new Date()),
      ]);
      const result = await service.getSummary(mockUser);
      expect(result.totalIncome).toBe(1500);
      expect(result.totalExpenses).toBe(300);
      expect(result.netBalance).toBe(1200);
    });

    it('returns zeros when no records', async () => {
      mockPrisma.financialRecord.findMany.mockResolvedValue([]);
      const result = await service.getSummary(mockUser);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netBalance).toBe(0);
    });
  });

  describe('getByCategory', () => {
    it('aggregates by category correctly', async () => {
      mockPrisma.financialRecord.findMany.mockResolvedValue([
        makeRecord(RecordType.INCOME, 1000, 'Salary', new Date()),
        makeRecord(RecordType.EXPENSE, 200, 'Salary', new Date()),
        makeRecord(RecordType.EXPENSE, 400, 'Rent', new Date()),
      ]);
      const result = await service.getByCategory(mockUser);
      const salary = result.find((r) => r.category === 'Salary');
      expect(salary?.income).toBe(1000);
      expect(salary?.expense).toBe(200);
      expect(salary?.net).toBe(800);
    });
  });

  describe('getRecent', () => {
    it('calls findMany with correct params', async () => {
      mockPrisma.financialRecord.findMany.mockResolvedValue([]);
      await service.getRecent(mockUser, 5);
      expect(mockPrisma.financialRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, orderBy: { date: 'desc' } }),
      );
    });
  });
});
