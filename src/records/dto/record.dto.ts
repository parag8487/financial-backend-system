import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsNotFuture } from '../../common/decorators/is-not-future.decorator';

export class CreateRecordDto {
    @ApiProperty({
        example: 1500.0,
        description: 'The monetary value of the transaction. Max 2 decimal places.',
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amount: number;

    @ApiProperty({
        enum: RecordType,
        example: RecordType.INCOME,
        description: 'Categorization as either INCOME or EXPENSE',
    })
    @IsEnum(RecordType)
    type: RecordType;

    @ApiProperty({
        example: 'Salary',
        description: 'Specific category label (e.g. Food, Rent, Salary, Freelance)',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    category: string;

    @ApiPropertyOptional({
        example: 'Monthly salary payment from tech job',
        description: 'Optional additional context for the record',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiProperty({
        example: '2024-03-01T00:00:00.000Z',
        description: 'ISO 8601 date string. Cannot be in the future.',
    })
    @IsDateString()
    @IsNotFuture()
    date: string;
}

export class UpdateRecordDto {
    @ApiPropertyOptional({
        example: 1800.0,
        description: 'Updated monetary value',
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amount?: number;

    @ApiPropertyOptional({
        enum: RecordType,
        description: 'Updated transaction type',
    })
    @IsOptional()
    @IsEnum(RecordType)
    type?: RecordType;

    @ApiPropertyOptional({
        example: 'Consulting',
        description: 'Updated category label',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @ApiPropertyOptional({
        description: 'Updated detailed description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Updated ISO 8601 date string',
    })
    @IsOptional()
    @IsDateString()
    @IsNotFuture()
    date?: string;
}

export class FilterRecordsDto {
    @ApiPropertyOptional({
        enum: RecordType,
        description: 'Filter by transaction type',
    })
    @IsOptional()
    @IsEnum(RecordType)
    type?: RecordType;

    @ApiPropertyOptional({
        example: 'Salary',
        description: 'Filter by specific category',
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({
        example: '2024-01-01',
        description: 'ISO date string for start of range (inclusive)',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({
        example: '2024-12-31',
        description: 'ISO date string for end of range (inclusive)',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({
        example: 'march',
        description: 'Full-text search query for descriptions and categories',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 100,
        description: 'Minimum amount filter',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minAmount?: number;

    @ApiPropertyOptional({
        example: 5000,
        description: 'Maximum amount filter',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxAmount?: number;

    @ApiPropertyOptional({
        default: 1,
        description: 'Page number for pagination',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional({
        default: 20,
        description: 'Number of records per page',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;
}
