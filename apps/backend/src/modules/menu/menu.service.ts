import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
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

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MENU OPERATIONS
  // ============================================

  async createMenu(createMenuDto: CreateMenuDto, tenantId: string) {
    // Verify branch belongs to tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createMenuDto.branchId,
        tenantId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.menu.create({
      data: createMenuDto,
      include: {
        categories: {
          include: {
            products: true,
          },
        },
      },
    });
  }

  async getMenus(tenantId: string, branchId?: string) {
    return this.prisma.menu.findMany({
      where: {
        branch: {
          tenantId,
          ...(branchId && { id: branchId }),
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            products: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                variants: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  async getMenu(id: string, tenantId: string) {
    const menu = await this.prisma.menu.findFirst({
      where: {
        id,
        branch: { tenantId },
      },
      include: {
        branch: true,
        categories: {
          orderBy: { order: 'asc' },
          include: {
            products: {
              orderBy: { order: 'asc' },
              include: {
                variants: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async updateMenu(id: string, updateMenuDto: UpdateMenuDto, tenantId: string) {
    // Verify menu belongs to tenant
    await this.getMenu(id, tenantId);

    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
      include: {
        categories: {
          include: {
            products: true,
          },
        },
      },
    });
  }

  async deleteMenu(id: string, tenantId: string) {
    // Verify menu belongs to tenant
    await this.getMenu(id, tenantId);

    return this.prisma.menu.delete({
      where: { id },
    });
  }

  // ============================================
  // CATEGORY OPERATIONS
  // ============================================

  async createCategory(createCategoryDto: CreateCategoryDto, tenantId: string) {
    // Verify menu belongs to tenant
    const menu = await this.prisma.menu.findFirst({
      where: {
        id: createCategoryDto.menuId,
        branch: { tenantId },
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
      include: {
        products: true,
      },
    });
  }

  async getCategories(menuId: string, tenantId: string) {
    // Verify menu belongs to tenant
    await this.getMenu(menuId, tenantId);

    return this.prisma.category.findMany({
      where: { menuId },
      orderBy: { order: 'asc' },
      include: {
        products: {
          orderBy: { order: 'asc' },
          include: {
            variants: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async getCategory(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        menu: {
          branch: { tenantId },
        },
      },
      include: {
        products: {
          orderBy: { order: 'asc' },
          include: {
            variants: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto, tenantId: string) {
    // Verify category belongs to tenant
    await this.getCategory(id, tenantId);

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        products: true,
      },
    });
  }

  async deleteCategory(id: string, tenantId: string) {
    // Verify category belongs to tenant
    await this.getCategory(id, tenantId);

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // ============================================
  // PRODUCT OPERATIONS
  // ============================================

  async createProduct(createProductDto: CreateProductDto, tenantId: string) {
    // Verify category belongs to tenant
    const category = await this.prisma.category.findFirst({
      where: {
        id: createProductDto.categoryId,
        menu: {
          branch: { tenantId },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.product.create({
      data: createProductDto,
      include: {
        variants: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getProducts(categoryId: string, tenantId: string) {
    // Verify category belongs to tenant
    await this.getCategory(categoryId, tenantId);

    return this.prisma.product.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
      include: {
        variants: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getProduct(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        category: {
          menu: {
            branch: { tenantId },
          },
        },
      },
      include: {
        variants: {
          orderBy: { order: 'asc' },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, tenantId: string) {
    // Verify product belongs to tenant
    await this.getProduct(id, tenantId);

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        variants: true,
      },
    });
  }

  async deleteProduct(id: string, tenantId: string) {
    // Verify product belongs to tenant
    await this.getProduct(id, tenantId);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // ============================================
  // PRODUCT VARIANT OPERATIONS
  // ============================================

  async createProductVariant(createVariantDto: CreateProductVariantDto, tenantId: string) {
    // Verify product belongs to tenant
    await this.getProduct(createVariantDto.productId, tenantId);

    return this.prisma.productVariant.create({
      data: createVariantDto,
    });
  }

  async getProductVariants(productId: string, tenantId: string) {
    // Verify product belongs to tenant
    await this.getProduct(productId, tenantId);

    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    });
  }

  async updateProductVariant(id: string, updateVariantDto: UpdateProductVariantDto, tenantId: string) {
    // Verify variant belongs to tenant
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          category: {
            menu: {
              branch: { tenantId },
            },
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: updateVariantDto,
    });
  }

  async deleteProductVariant(id: string, tenantId: string) {
    // Verify variant belongs to tenant
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          category: {
            menu: {
              branch: { tenantId },
            },
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return this.prisma.productVariant.delete({
      where: { id },
    });
  }
}
