import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, Min } from 'class-validator';

export enum BudgetPeriod {
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
}

export class CreateBudgetDto {
    @ApiProperty({ example: 'Food', description: 'Expense category for this budget' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ example: 500, description: 'Maximum spending limit' })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
    @IsEnum(BudgetPeriod)
    period: BudgetPeriod = BudgetPeriod.MONTHLY;
}
