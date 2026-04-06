import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role, Status } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'analyst@example.com',
    description: 'Unique email address for the new user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'NewSecureP@ss1',
    description: 'Password for the user account (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: Role,
    example: Role.ANALYST,
    description: 'Assign hierarchical role level (VIEWER, ANALYST, ADMIN)',
  })
  @IsEnum(Role)
  role: Role;
}

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
