import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/budget.dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    return (this.prisma as any).budget.findMany({
      where: { userId: user.id },
      orderBy: { category: 'asc' },
    });
  }

  async create(user: AuthUser, dto: CreateBudgetDto) {
    // Upsert logic: One budget per category per period
    return (this.prisma as any).budget.upsert({
      where: {
        userId_category_period: {
          userId: user.id,
          category: dto.category,
          period: dto.period,
        },
      },
      create: {
        ...dto,
        userId: user.id,
      },
      update: {
        amount: dto.amount,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { id },
    });
    if (!budget || budget.userId !== user.id) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return (this.prisma as any).budget.delete({ where: { id } });
  }
}
