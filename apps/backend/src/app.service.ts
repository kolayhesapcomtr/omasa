import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getInfo() {
    return {
      name: 'Omasa API',
      version: '1.0.0',
      description: 'QR Menu and Restaurant Management System',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/docs',
      },
    };
  }
}
