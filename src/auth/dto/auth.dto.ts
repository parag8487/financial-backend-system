import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'admin@example.com',
        description: 'Unique email address for registration',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'StrongP@ss1',
        minLength: 8,
        description: 'Secure password (min 8 characters)',
    })
    @IsString()
    @MinLength(8)
    password: string;
}

export class LoginDto {
    @ApiProperty({
        example: 'admin@example.com',
        description: 'Registered user email',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'StrongP@ss1',
        description: 'User password',
    })
    @IsString()
    password: string;
}
