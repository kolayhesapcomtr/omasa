import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ example: 'Ana Menü' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Restoranımızın ana menüsü' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'branch-id' })
  @IsString()
  branchId: string;
}

export class UpdateMenuDto {
  @ApiPropertyOptional({ example: 'Güncellenmiş Menü' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Güncellenmiş açıklama' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
