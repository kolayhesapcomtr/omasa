import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrinterService } from './printer.service';
import {
  CreatePrinterDto,
  UpdatePrinterDto,
  PrintOrderDto,
  PrintBillDto,
  PrintReceiptDto,
  TestPrintDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/printers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  // ============================================
  // PRINTER MANAGEMENT
  // ============================================

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createPrinter(@Body() dto: CreatePrinterDto, @GetUser() user: any) {
    return this.printerService.createPrinter(dto, user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async updatePrinter(
    @Param('id') id: string,
    @Body() dto: UpdatePrinterDto,
    @GetUser() user: any,
  ) {
    return this.printerService.updatePrinter(id, dto, user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async deletePrinter(@Param('id') id: string, @GetUser() user: any) {
    return this.printerService.deletePrinter(id, user.tenantId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async getPrinters(@Query('branchId') branchId: string, @GetUser() user: any) {
    return this.printerService.getPrinters(user.tenantId, branchId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async getPrinter(@Param('id') id: string, @GetUser() user: any) {
    return this.printerService.getPrinter(id, user.tenantId);
  }

  // ============================================
  // PRINT OPERATIONS
  // ============================================

  @Post('print/order')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN)
  async printOrder(@Body() dto: PrintOrderDto, @GetUser() user: any) {
    return this.printerService.printOrder(dto, user.tenantId);
  }

  @Post('print/bill')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  async printBill(@Body() dto: PrintBillDto, @GetUser() user: any) {
    return this.printerService.printBill(dto, user.tenantId);
  }

  @Post('print/receipt')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async printReceipt(@Body() dto: PrintReceiptDto, @GetUser() user: any) {
    return this.printerService.printReceipt(dto, user.tenantId);
  }

  @Post('test/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async testPrint(@Param('id') id: string, @GetUser() user: any) {
    return this.printerService.testPrint(id, user.tenantId);
  }

  // ============================================
  // PRINT JOB MANAGEMENT
  // ============================================

  @Get('jobs')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getPrintJobs(@Query('printerId') printerId: string, @GetUser() user: any) {
    return this.printerService.getPrintJobs(user.tenantId, printerId);
  }

  @Post('jobs/:id/retry')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async retryPrintJob(@Param('id') id: string, @GetUser() user: any) {
    return this.printerService.retryPrintJob(id, user.tenantId);
  }
}
