import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'mehmet@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Mehmet' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Yılmaz' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.WAITER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'mehmet@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Mehmet' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Yılmaz' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.WAITER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
