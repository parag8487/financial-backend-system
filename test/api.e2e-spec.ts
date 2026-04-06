import { join } from 'path';

// Use absolute path for test database to ensure consistency
const testDbPath = join(process.cwd(), 'test-e2e.db');
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = 'test-secret-key';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, RecordType } from '@prisma/client';
import { execSync } from 'child_process';

describe('Financial API (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Helper to get tokens for different roles
    let adminToken: string;
    let analystToken: string;
    let viewerToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(ConfigService)
            .useValue({
                get: (key: string) => {
                    if (key === 'DATABASE_URL') return process.env.DATABASE_URL;
                    if (key === 'JWT_SECRET') return process.env.JWT_SECRET;
                    return process.env[key];
                }
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Clean database in-process to ensure file locking issues are avoided
        await (prisma as any).financialRecord.deleteMany();
        await (prisma as any).budget.deleteMany();
        await (prisma as any).systemLog.deleteMany();
        await (prisma as any).user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Auth & Setup', () => {
        it('should register and login as admin', async () => {
            const email = 'admin@test.com';
            const password = 'Password123!';

            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email, password })
                .expect(201);

            // Manually elevate to ADMIN in DB
            await prisma.user.update({
                where: { email },
                data: { role: Role.ADMIN }
            });

            const loginRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email, password })
                .expect(200);

            adminToken = loginRes.body.data.accessToken;
            expect(adminToken).toBeDefined();
        });

        it('should create an analyst and a viewer via admin', async () => {
            const analystRes = await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'analyst@test.com', password: 'Password123!', role: Role.ANALYST })
                .expect(201);

            const viewerRes = await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'viewer@test.com', password: 'Password123!', role: Role.VIEWER })
                .expect(201);

            // Get tokens
            const aLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'analyst@test.com', password: 'Password123!' });
            analystToken = aLogin.body.data.accessToken;

            const vLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'viewer@test.com', password: 'Password123!' });
            viewerToken = vLogin.body.data.accessToken;
        });
    });

    describe('RBAC Enforcement', () => {
        it('VIEWER should NOT be able to create a record (403)', async () => {
            await request(app.getHttpServer())
                .post('/records')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    amount: 100,
                    type: RecordType.INCOME,
                    category: 'Test',
                    date: new Date().toISOString()
                })
                .expect(403);
        });

        it('ANALYST should be able to create a record (201)', async () => {
            await request(app.getHttpServer())
                .post('/records')
                .set('Authorization', `Bearer ${analystToken}`)
                .send({
                    amount: 500,
                    type: RecordType.INCOME,
                    category: 'Salary',
                    date: new Date().toISOString()
                })
                .expect(201);
        });
    });

    describe('Ownership & Records CRUD', () => {
        let recordId: string;

        it('should create a record for ownership testing', async () => {
            const res = await request(app.getHttpServer())
                .post('/records')
                .set('Authorization', `Bearer ${analystToken}`)
                .send({
                    amount: 200,
                    type: RecordType.EXPENSE,
                    category: 'Food',
                    date: new Date().toISOString(),
                    description: 'Lunch'
                });
            recordId = res.body.data.id;
        });

        it('ANALYST should be able to update own record', async () => {
            await request(app.getHttpServer())
                .patch(`/records/${recordId}`)
                .set('Authorization', `Bearer ${analystToken}`)
                .send({ amount: 250 })
                .expect(200);
        });

        it('ANALYST should NOT be able to update record of another user', async () => {
            // Register another analyst
            await request(app.getHttpServer()).post('/auth/register').send({ email: 'other@test.com', password: 'Password123!' });
            await prisma.user.update({ where: { email: 'other@test.com' }, data: { role: Role.ANALYST } });

            const login = await request(app.getHttpServer()).post('/auth/login').send({ email: 'other@test.com', password: 'Password123!' });
            const otherToken = login.body.data.accessToken;

            await request(app.getHttpServer())
                .patch(`/records/${recordId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ amount: 1000 })
                .expect(403);
        });

        it('ADMIN should be able to update any record', async () => {
            await request(app.getHttpServer())
                .patch(`/records/${recordId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ amount: 300 })
                .expect(200);
        });

        it('ADMIN should be able to soft-delete a record', async () => {
            await request(app.getHttpServer())
                .delete(`/records/${recordId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);

            // Verify it is hidden from list
            const list = await request(app.getHttpServer())
                .get('/records')
                .set('Authorization', `Bearer ${adminToken}`);

            const found = list.body.data.items.find((r: any) => r.id === recordId);
            expect(found).toBeUndefined();
        });
    });

    describe('Dashboard', () => {
        it('should return dashboard summary', async () => {
            const res = await request(app.getHttpServer())
                .get('/dashboard/summary')
                .set('Authorization', `Bearer ${viewerToken}`)
                .expect(200);

            expect(res.body.data).toHaveProperty('totalIncome');
            expect(res.body.data).toHaveProperty('totalExpenses');
        });
    });
});
