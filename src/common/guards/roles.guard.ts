import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.VIEWER]: 1,
    [Role.ANALYST]: 2,
    [Role.ADMIN]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new ForbiddenException('Access denied');
        }

        const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
        const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r]));

        if (userLevel < minRequired) {
            throw new ForbiddenException(
                `Required role: ${requiredRoles.join(' or ')}. Your role: ${user.role}`,
            );
        }
        return true;
    }
}
