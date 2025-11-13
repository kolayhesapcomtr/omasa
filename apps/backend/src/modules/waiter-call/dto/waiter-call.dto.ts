import { IsString, IsEnum, IsOptional } from 'class-validator';
import { WaiterCallType, WaiterCallStatus } from '@prisma/client';

export class CreateWaiterCallDto {
  @IsString()
  tableId: string;

  @IsEnum(WaiterCallType)
  @IsOptional()
  type?: WaiterCallType;

  @IsString()
  @IsOptional()
  message?: string;
}

export class UpdateWaiterCallStatusDto {
  @IsEnum(WaiterCallStatus)
  status: WaiterCallStatus;
}

export class WaiterCallResponseDto {
  id: string;
  tableId: string;
  tableNumber: string;
  tableName?: string;
  tableArea?: string;
  branchId: string;
  branchName: string;
  type: WaiterCallType;
  status: WaiterCallStatus;
  message?: string;
  respondedById?: string;
  respondedByName?: string;
  acknowledgedAt?: Date;
  respondedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
