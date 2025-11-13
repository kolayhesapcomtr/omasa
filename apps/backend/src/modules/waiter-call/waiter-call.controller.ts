import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WaiterCallService } from './waiter-call.service';
import { CreateWaiterCallDto, UpdateWaiterCallStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole, WaiterCallStatus } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/waiter-calls')
export class WaiterCallController {
  constructor(private readonly waiterCallService: WaiterCallService) {}

  // ============================================
  // PUBLIC ENDPOINTS (For QR Menu - No Auth)
  // ============================================

  @Post('public')
  @Public()
  async createCallPublic(@Body() dto: CreateWaiterCallDto) {
    return this.waiterCallService.createCall(dto);
  }

  // ============================================
  // AUTHENTICATED ENDPOINTS (For Staff)
  // ============================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async getCalls(
    @Query('branchId') branchId: string,
    @Query('status') status: WaiterCallStatus,
    @GetUser() user: any,
  ) {
    return this.waiterCallService.getCalls(user.tenantId, branchId, status);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async getPendingCalls(@Query('branchId') branchId: string, @GetUser() user: any) {
    return this.waiterCallService.getPendingCalls(user.tenantId, branchId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getCallStats(@Query('branchId') branchId: string, @GetUser() user: any) {
    return this.waiterCallService.getCallStats(user.tenantId, branchId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async getCall(@Param('id') id: string, @GetUser() user: any) {
    return this.waiterCallService.getCall(id, user.tenantId);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async updateCallStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWaiterCallStatusDto,
    @GetUser() user: any,
  ) {
    return this.waiterCallService.updateCallStatus(id, dto, user.tenantId, user.userId);
  }

  @Post(':id/acknowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async acknowledgeCall(@Param('id') id: string, @GetUser() user: any) {
    return this.waiterCallService.acknowledgeCall(id, user.tenantId, user.userId);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async respondToCall(@Param('id') id: string, @GetUser() user: any) {
    return this.waiterCallService.respondToCall(id, user.tenantId, user.userId);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async completeCall(@Param('id') id: string, @GetUser() user: any) {
    return this.waiterCallService.completeCall(id, user.tenantId, user.userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async cancelCall(@Param('id') id: string, @GetUser() user: any) {
    return this.waiterCallService.cancelCall(id, user.tenantId);
  }
}
