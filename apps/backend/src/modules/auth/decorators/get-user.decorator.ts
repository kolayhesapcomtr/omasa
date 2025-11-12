import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    status: string;
  };
}

export const GetUser = createParamDecorator((data: string, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
