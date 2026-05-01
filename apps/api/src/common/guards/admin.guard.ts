import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    if (request.user?.role === 'ADMIN') return true;
    throw new ForbiddenException('Admin access required');
  }
}
