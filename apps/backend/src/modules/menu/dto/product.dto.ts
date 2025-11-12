import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Margherita Pizza' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Klasik İtalyan pizzası' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/pizza.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 89.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'category-id' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: ['gluten', 'dairy'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergens?: string[];

  @ApiPropertyOptional({ example: ['vegan', 'spicy', 'popular'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Güncellenmiş Ürün' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Güncellenmiş açıklama' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: 99.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: ['gluten'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergens?: string[];

  @ApiPropertyOptional({ example: ['popular'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

// Product Variant DTOs
export class CreateProductVariantDto {
  @ApiProperty({ example: 'Küçük' })
  @IsString()
  name: string;

  @ApiProperty({ example: 59.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'product-id' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ example: 'Orta' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 79.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
