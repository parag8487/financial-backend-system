import { PrismaClient, Role, RecordType } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Cleanup existing data
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Users
    const password = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@finance.com',
            password,
            role: Role.ADMIN,
        },
    });

    const analyst = await prisma.user.create({
        data: {
            email: 'analyst@finance.com',
            password,
            role: Role.ANALYST,
        },
    });

    const viewer = await prisma.user.create({
        data: {
            email: 'viewer@finance.com',
            password,
            role: Role.VIEWER,
        },
    });

    console.log('✅ Users created: Admin, Analyst, Viewer');

    // 3. Create Records
    const categories = ['Salary', 'Freelance', 'Rent', 'Food', 'Groceries', 'Entertainment', 'Transport', 'Utilities'];
    const recordsData = [];

    for (let i = 0; i < 60; i++) {
        const isIncome = Math.random() > 0.7;
        const category = categories[Math.floor(Math.random() * categories.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // last 90 days

        recordsData.push({
            amount: isIncome ? (500 + Math.random() * 2000) : (10 + Math.random() * 200),
            type: isIncome ? RecordType.INCOME : RecordType.EXPENSE,
            category,
            description: `Test record ${i + 1} - ${category}`,
            date,
            userId: analyst.id,
        });
    }

    await prisma.financialRecord.createMany({
        data: recordsData,
    });

    console.log(`✅ ${recordsData.length} financial records seeded.`);
    console.log('🚀 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
