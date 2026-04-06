import { Injectable } from '@nestjs/common';
import { Role, RecordType } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getBaseWhere(user: AuthUser) {
    return {
      deletedAt: null,
      ...(user.role !== Role.ADMIN && { userId: user.id }),
    };
  }

  async getSummary(user: AuthUser) {
    const records = await this.prisma.financialRecord.findMany({
      where: this.getBaseWhere(user),
      select: { amount: true, type: true },
    });

    const totalIncome = records
      .filter((r) => r.type === RecordType.INCOME)
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpenses = records
      .filter((r) => r.type === RecordType.EXPENSE)
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  }

  async getByCategory(user: AuthUser) {
    const records = await this.prisma.financialRecord.findMany({
      where: this.getBaseWhere(user),
      select: { category: true, amount: true, type: true },
    });

    const map = new Map<string, { income: number; expense: number }>();
    for (const r of records) {
      const key = r.category;
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (r.type === RecordType.INCOME) entry.income += r.amount;
      else entry.expense += r.amount;
    }

    return Array.from(map.entries()).map(([category, totals]) => ({
      category,
      ...totals,
      net: totals.income - totals.expense,
    }));
  }

  async getTrends(user: AuthUser, period: 'weekly' | 'monthly' = 'monthly') {
    const records = await this.prisma.financialRecord.findMany({
      where: this.getBaseWhere(user),
      select: { amount: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    const map = new Map<string, { income: number; expense: number }>();
    for (const r of records) {
      const d = new Date(r.date);
      const key =
        period === 'weekly'
          ? `${d.getFullYear()}-W${this.getWeekNumber(d)}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (r.type === RecordType.INCOME) entry.income += r.amount;
      else entry.expense += r.amount;
    }

    return Array.from(map.entries()).map(([periodLabel, totals]) => ({
      period: periodLabel,
      ...totals,
      net: totals.income - totals.expense,
    }));
  }

  async getRecent(user: AuthUser, limit = 10) {
    return this.prisma.financialRecord.findMany({
      where: this.getBaseWhere(user),
      orderBy: { date: 'desc' },
      take: limit,
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async getBudgetStatus(user: AuthUser) {
    const budgets = await (this.prisma as any).budget.findMany({
      where: { userId: user.id },
    });

    const records = await this.prisma.financialRecord.findMany({
      where: {
        ...this.getBaseWhere(user),
        type: RecordType.EXPENSE,
      },
      select: { category: true, amount: true },
    });

    // Sum actual expenses
    const actualMap = new Map<string, number>();
    for (const r of records) {
      actualMap.set(r.category, (actualMap.get(r.category) || 0) + r.amount);
    }

    return budgets.map((b: any) => {
      const actual = actualMap.get(b.category) || 0;
      return {
        category: b.category,
        limit: b.amount,
        actual,
        remaining: b.amount - actual,
        utilization: b.amount > 0 ? (actual / b.amount) * 100 : 0,
      };
    });
  }

  private getWeekNumber(d: Date): number {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  }
}
