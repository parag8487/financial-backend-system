import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, Status } from '@prisma/client';

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: 'analyst@example.com',
        description: 'New unique email address for the user',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({
        enum: Role,
        example: Role.ANALYST,
        description: 'Update the hierarchical role level',
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @ApiPropertyOptional({
        enum: Status,
        example: Status.INACTIVE,
        description: 'Update account status (ACTIVE/INACTIVE)',
    })
    @IsEnum(Status)
    @IsOptional()
    status?: Status;

    @ApiPropertyOptional({
        example: 'NewSecureP@ss1',
        description: 'Reset the user password (min 6 characters)',
    })
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;
}
