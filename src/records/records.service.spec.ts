import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, RecordType } from '@prisma/client';
import { RecordsService } from './records.service';
import { PrismaService } from '../prisma/prisma.service';

const makeRecord = (overrides = {}) => ({
    id: 'r1',
    userId: 'u1',
    amount: 100,
    type: RecordType.INCOME,
    category: 'Salary',
    description: null,
    date: new Date(),
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

const mockPrisma = {
    financialRecord: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    systemLog: {
        create: jest.fn(),
    },
};

const adminUser = { id: 'admin1', role: Role.ADMIN };
const analystUser = { id: 'u1', role: Role.ANALYST };
const otherAnalyst = { id: 'u2', role: Role.ANALYST };

describe('RecordsService', () => {
    let service: RecordsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecordsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get<RecordsService>(RecordsService);
        jest.clearAllMocks();

        // Default mock behaviors
        mockPrisma.systemLog.create.mockResolvedValue({});
        mockPrisma.financialRecord.create.mockResolvedValue(makeRecord());
        mockPrisma.financialRecord.update.mockResolvedValue(makeRecord());
        mockPrisma.financialRecord.count.mockResolvedValue(0);
        mockPrisma.financialRecord.findMany.mockResolvedValue([]);
    });

    describe('findAll', () => {
        it('returns paginated items', async () => {
            mockPrisma.financialRecord.count.mockResolvedValue(1);
            mockPrisma.financialRecord.findMany.mockResolvedValue([makeRecord()]);
            const result = await service.findAll(adminUser, { page: 1, limit: 10 });
            expect(result.meta.total).toBe(1);
            expect(result.items).toHaveLength(1);
        });
    });

    describe('create', () => {
        it('creates a record for the authenticated user', async () => {
            mockPrisma.financialRecord.create.mockResolvedValue(makeRecord());
            const result = await service.create(analystUser, {
                amount: 100,
                type: RecordType.INCOME,
                category: 'Salary',
                date: new Date().toISOString(),
            });
            expect(result.id).toBe('r1');
            expect(mockPrisma.financialRecord.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('update', () => {
        it('allows user to update own record', async () => {
            mockPrisma.financialRecord.findFirst.mockResolvedValue(makeRecord({ userId: 'u1' }));
            mockPrisma.financialRecord.update.mockResolvedValue(makeRecord({ amount: 200 }));
            const result = await service.update(analystUser, 'r1', { amount: 200 });
            expect(result.amount).toBe(200);
        });

        it('allows admin to update any record', async () => {
            mockPrisma.financialRecord.findFirst.mockResolvedValue(makeRecord({ userId: 'other' }));
            mockPrisma.financialRecord.update.mockResolvedValue(makeRecord({ amount: 999 }));
            const result = await service.update(adminUser, 'r1', { amount: 999 });
            expect(result.amount).toBe(999);
        });

        it("throws ForbiddenException when analyst updates another user's record", async () => {
            mockPrisma.financialRecord.findFirst.mockResolvedValue(makeRecord({ userId: 'u1' }));
            await expect(
                service.update(otherAnalyst, 'r1', { amount: 999 }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException for non-existent record', async () => {
            mockPrisma.financialRecord.findFirst.mockResolvedValue(null);
            await expect(
                service.update(adminUser, 'missing', { amount: 100 }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('softDelete', () => {
        it('sets deletedAt on existing record', async () => {
            mockPrisma.financialRecord.findFirst.mockResolvedValue(makeRecord());
            mockPrisma.financialRecord.update.mockResolvedValue(
                makeRecord({ deletedAt: new Date() }),
            );
            const result = await service.softDelete('r1', adminUser);
            expect(result.deletedAt).toBeTruthy();
        });

        it('throws NotFoundException when record not found', async () => {
            mockPrisma.financialRecord.findFirst.mockResolvedValue(null);
            await expect(service.softDelete('missing', adminUser)).rejects.toThrow(NotFoundException);
        });
    });
});
