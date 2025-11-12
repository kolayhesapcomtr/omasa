import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, Min, IsEnum } from 'class-validator';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
  @ApiProperty({ example: '1' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'Bahçe Masa 1' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'branch-id' })
  @IsString()
  branchId: string;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 'Bahçe' })
  @IsString()
  @IsOptional()
  area?: string;
}

export class UpdateTableDto {
  @ApiPropertyOptional({ example: '2' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ example: 'VIP Masa 1' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 'Teras' })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional({ enum: TableStatus })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GenerateQRDto {
  @ApiProperty({ example: ['table-id-1', 'table-id-2'] })
  @IsString({ each: true })
  tableIds: string[];
}
