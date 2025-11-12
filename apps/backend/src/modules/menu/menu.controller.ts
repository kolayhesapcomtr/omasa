import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import {
  CreateMenuDto,
  UpdateMenuDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto';
import { GetUser, RequestUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ============================================
  // MENU ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new menu' })
  @ApiResponse({ status: 201, description: 'Menu created successfully' })
  async createMenu(@Body() createMenuDto: CreateMenuDto, @GetUser() user: RequestUser) {
    return this.menuService.createMenu(createMenuDto, user.tenantId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all menus for tenant' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Menus retrieved successfully' })
  async getMenus(@Query('branchId') branchId: string, @GetUser() user: RequestUser) {
    return this.menuService.getMenus(user.tenantId, branchId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get menu by ID' })
  @ApiResponse({ status: 200, description: 'Menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async getMenu(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.getMenu(id, user.tenantId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update menu' })
  @ApiResponse({ status: 200, description: 'Menu updated successfully' })
  async updateMenu(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @GetUser() user: RequestUser,
  ) {
    return this.menuService.updateMenu(id, updateMenuDto, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete menu' })
  @ApiResponse({ status: 200, description: 'Menu deleted successfully' })
  async deleteMenu(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.deleteMenu(id, user.tenantId);
  }

  // ============================================
  // CATEGORY ENDPOINTS
  // ============================================

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @GetUser() user: RequestUser) {
    return this.menuService.createCategory(createCategoryDto, user.tenantId);
  }

  @Get('categories/menu/:menuId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories for a menu' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Param('menuId') menuId: string, @GetUser() user: RequestUser) {
    return this.menuService.getCategories(menuId, user.tenantId);
  }

  @Get('categories/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  async getCategory(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.getCategory(id, user.tenantId);
  }

  @Put('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: RequestUser,
  ) {
    return this.menuService.updateCategory(id, updateCategoryDto, user.tenantId);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async deleteCategory(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.deleteCategory(id, user.tenantId);
  }

  // ============================================
  // PRODUCT ENDPOINTS
  // ============================================

  @Post('products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(@Body() createProductDto: CreateProductDto, @GetUser() user: RequestUser) {
    return this.menuService.createProduct(createProductDto, user.tenantId);
  }

  @Get('products/category/:categoryId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products for a category' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(@Param('categoryId') categoryId: string, @GetUser() user: RequestUser) {
    return this.menuService.getProducts(categoryId, user.tenantId);
  }

  @Get('products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async getProduct(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.getProduct(id, user.tenantId);
  }

  @Put('products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: RequestUser,
  ) {
    return this.menuService.updateProduct(id, updateProductDto, user.tenantId);
  }

  @Delete('products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async deleteProduct(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.deleteProduct(id, user.tenantId);
  }

  // ============================================
  // PRODUCT VARIANT ENDPOINTS
  // ============================================

  @Post('variants')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new product variant' })
  @ApiResponse({ status: 201, description: 'Variant created successfully' })
  async createProductVariant(
    @Body() createVariantDto: CreateProductVariantDto,
    @GetUser() user: RequestUser,
  ) {
    return this.menuService.createProductVariant(createVariantDto, user.tenantId);
  }

  @Get('variants/product/:productId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all variants for a product' })
  @ApiResponse({ status: 200, description: 'Variants retrieved successfully' })
  async getProductVariants(@Param('productId') productId: string, @GetUser() user: RequestUser) {
    return this.menuService.getProductVariants(productId, user.tenantId);
  }

  @Put('variants/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product variant' })
  @ApiResponse({ status: 200, description: 'Variant updated successfully' })
  async updateProductVariant(
    @Param('id') id: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
    @GetUser() user: RequestUser,
  ) {
    return this.menuService.updateProductVariant(id, updateVariantDto, user.tenantId);
  }

  @Delete('variants/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiResponse({ status: 200, description: 'Variant deleted successfully' })
  async deleteProductVariant(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.menuService.deleteProductVariant(id, user.tenantId);
  }
}
