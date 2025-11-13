import { Module, forwardRef } from '@nestjs/common';
import { WaiterCallController } from './waiter-call.controller';
import { WaiterCallService } from './waiter-call.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule)],
  controllers: [WaiterCallController],
  providers: [WaiterCallService],
  exports: [WaiterCallService],
})
export class WaiterCallModule {}
