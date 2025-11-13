import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.tenantId = payload.tenantId;
      client.role = payload.role;

      // Join tenant room
      await client.join(`tenant:${client.tenantId}`);

      // Join role-specific room
      await client.join(`tenant:${client.tenantId}:${client.role}`);

      this.logger.log(
        `Client ${client.id} connected - User: ${client.userId}, Tenant: ${client.tenantId}, Role: ${client.role}`,
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        tenantId: client.tenantId,
        role: client.role,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join-branch')
  async handleJoinBranch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { branchId: string },
  ) {
    const room = `tenant:${client.tenantId}:branch:${data.branchId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined branch room: ${room}`);
    return { success: true, room };
  }

  // Emit events to specific rooms
  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToRole(tenantId: string, role: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}:${role}`).emit(event, data);
  }

  emitToBranch(tenantId: string, branchId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}:branch:${branchId}`).emit(event, data);
  }

  // Order-specific events
  notifyNewOrder(tenantId: string, branchId: string, order: any) {
    // Notify kitchen
    this.emitToRole(tenantId, 'KITCHEN', 'order:new', {
      orderId: order.id,
      tableNumber: order.table?.number,
      items: order.items,
      createdAt: order.createdAt,
    });

    // Notify managers and owners
    this.emitToRole(tenantId, 'OWNER', 'order:new', order);
    this.emitToRole(tenantId, 'MANAGER', 'order:new', order);

    this.logger.log(`New order notification sent - Order: ${order.id}, Tenant: ${tenantId}`);
  }

  notifyOrderStatusChange(tenantId: string, order: any) {
    // Notify all roles in tenant
    this.emitToTenant(tenantId, 'order:status-changed', {
      orderId: order.id,
      status: order.status,
      tableNumber: order.table?.number,
      waiterId: order.waiterId,
    });

    // If order is ready, specifically notify the waiter
    if (order.status === 'READY' && order.waiterId) {
      this.server.to(`tenant:${tenantId}:WAITER`).emit('order:ready', {
        orderId: order.id,
        tableNumber: order.table?.number,
      });
    }

    this.logger.log(`Order status change notification sent - Order: ${order.id}, Status: ${order.status}`);
  }

  notifyPaymentCompleted(tenantId: string, payment: any) {
    // Notify managers and owners
    this.emitToRole(tenantId, 'OWNER', 'payment:completed', payment);
    this.emitToRole(tenantId, 'MANAGER', 'payment:completed', payment);

    this.logger.log(`Payment notification sent - Payment: ${payment.id}, Tenant: ${tenantId}`);
  }

  notifyTableStatusChange(tenantId: string, branchId: string, table: any) {
    // Notify all in branch
    this.emitToBranch(tenantId, branchId, 'table:status-changed', {
      tableId: table.id,
      number: table.number,
      status: table.status,
    });

    this.logger.log(`Table status change notification sent - Table: ${table.id}`);
  }
}
