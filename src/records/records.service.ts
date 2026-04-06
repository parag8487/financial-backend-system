import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRecordDto,
  UpdateRecordDto,
  FilterRecordsDto,
} from './dto/record.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, filters: FilterRecordsDto) {
    const {
      type,
      category,
      dateFrom,
      dateTo,
      search,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
    } = filters;

    const where = {
      deletedAt: null,
      ...(user.role !== Role.ADMIN && { userId: user.id }),
      ...(type && { type }),
      ...(category && { category: { contains: category } }),
      ...(search && {
        OR: [
          { description: { contains: search } },
          { category: { contains: search } },
        ],
      }),
      ...((minAmount !== undefined || maxAmount !== undefined) && {
        amount: {
          ...(minAmount !== undefined && { gte: minAmount }),
          ...(maxAmount !== undefined && { lte: maxAmount }),
        },
      }),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.financialRecord.count({ where }),
      this.prisma.financialRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, email: true } } },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(user: AuthUser, dto: CreateRecordDto) {
    const record = await this.prisma.financialRecord.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        userId: user.id,
      },
    });

    await this.logAction(
      'CREATE',
      'FinancialRecord',
      record.id,
      user.id,
      JSON.stringify(dto),
    );
    return record;
  }

  async update(user: AuthUser, id: string, dto: UpdateRecordDto) {
    const record = await this.findRecordOrFail(id);

    if (user.role !== Role.ADMIN && record.userId !== user.id) {
      throw new ForbiddenException('You can only update your own records');
    }

    const updated = await this.prisma.financialRecord.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.date && { date: new Date(dto.date) }),
      },
    });

    await this.logAction(
      'UPDATE',
      'FinancialRecord',
      id,
      user.id,
      JSON.stringify(dto),
    );
    return updated;
  }

  async softDelete(id: string, user?: AuthUser) {
    await this.findRecordOrFail(id);
    const deleted = await this.prisma.financialRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (user) {
      await this.logAction('DELETE', 'FinancialRecord', id, user.id);
    }
    return deleted;
  }

  async exportToCsv(user: AuthUser): Promise<string> {
    const where = {
      deletedAt: null,
      ...(user.role !== Role.ADMIN && { userId: user.id }),
    };

    const records = await this.prisma.financialRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const header = 'ID,Type,Amount,Category,Date,Description\n';
    const rows = records
      .map((r) => {
        return [
          r.id,
          r.type,
          r.amount,
          `"${r.category.replace(/"/g, '""')}"`,
          r.date.toISOString(),
          r.description ? `"${r.description.replace(/"/g, '""')}"` : '',
        ].join(',');
      })
      .join('\n');

    await this.logAction('EXPORT_CSV', 'FinancialRecord', null, user.id);
    return header + rows;
  }

  private async logAction(
    action: string,
    entity: string,
    entityId: string | null,
    userId: string,
    details?: string,
  ) {
    await this.prisma.systemLog
      .create({
        data: { action, entity, entityId, userId, details },
      })
      .catch((err: unknown) =>
        console.error('Failed to create audit log', err),
      );
  }

  private async findRecordOrFail(id: string) {
    const record = await this.prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
    });
    if (!record) throw new NotFoundException(`Record ${id} not found`);
    return record;
  }
}
