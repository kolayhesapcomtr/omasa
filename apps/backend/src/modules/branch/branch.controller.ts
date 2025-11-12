import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { GetUser, RequestUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('branches')
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  async createBranch(@Body() createBranchDto: CreateBranchDto, @GetUser() user: RequestUser) {
    return this.branchService.createBranch(createBranchDto, user.tenantId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all branches for tenant' })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  async getBranches(@GetUser() user: RequestUser) {
    return this.branchService.getBranches(user.tenantId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch retrieved successfully' })
  async getBranch(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.branchService.getBranch(id, user.tenantId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  async updateBranch(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @GetUser() user: RequestUser,
  ) {
    return this.branchService.updateBranch(id, updateBranchDto, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  async deleteBranch(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.branchService.deleteBranch(id, user.tenantId);
  }
}
