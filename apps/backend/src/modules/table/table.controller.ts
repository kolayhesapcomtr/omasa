import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { GetUser, RequestUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('tables')
@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new table' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  async createTable(@Body() createTableDto: CreateTableDto, @GetUser() user: RequestUser) {
    return this.tableService.createTable(createTableDto, user.tenantId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tables for tenant' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Tables retrieved successfully' })
  async getTables(@Query('branchId') branchId: string, @GetUser() user: RequestUser) {
    return this.tableService.getTables(user.tenantId, branchId);
  }

  @Get('by-area/:branchId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tables grouped by area' })
  @ApiResponse({ status: 200, description: 'Tables grouped by area' })
  async getTablesByArea(@Param('branchId') branchId: string, @GetUser() user: RequestUser) {
    return this.tableService.getTablesByArea(branchId, user.tenantId);
  }

  @Get('qr/:qrCode')
  @Public()
  @ApiOperation({ summary: 'Get table by QR code (public endpoint for customers)' })
  @ApiResponse({ status: 200, description: 'Table retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async getTableByQRCode(@Param('qrCode') qrCode: string) {
    return this.tableService.getTableByQRCode(qrCode);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get table by ID' })
  @ApiResponse({ status: 200, description: 'Table retrieved successfully' })
  async getTable(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.tableService.getTable(id, user.tenantId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update table' })
  @ApiResponse({ status: 200, description: 'Table updated successfully' })
  async updateTable(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
    @GetUser() user: RequestUser,
  ) {
    return this.tableService.updateTable(id, updateTableDto, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete table' })
  @ApiResponse({ status: 200, description: 'Table deleted successfully' })
  async deleteTable(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.tableService.deleteTable(id, user.tenantId);
  }

  @Post(':id/regenerate-qr')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate QR code for table' })
  @ApiResponse({ status: 200, description: 'QR code regenerated successfully' })
  async regenerateQRCode(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.tableService.regenerateQRCode(id, user.tenantId);
  }
}
