import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsEmail } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Merkez Şube' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Atatürk Cad. No:123 Kadıköy/İstanbul' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'İstanbul' })
  @IsString()
  city: string;

  @ApiProperty({ example: '+905551234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'info@restaurant.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsString()
  @IsOptional()
  closingTime?: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Güncellenmiş Şube' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Güncellenmiş adres' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Ankara' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '+905557654321' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@restaurant.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ example: '23:00' })
  @IsString()
  @IsOptional()
  closingTime?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
