import { Module } from '@nestjs/common';
import { PrinterController } from './printer.controller';
import { PrinterService } from './printer.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService], // Export for use in OrderModule
})
export class PrinterModule {}
