import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
    sub: string;
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET', 'fallback-secret'),
        });
    }

    async validate(payload: JwtPayload) {
        console.log('[DEBUG] JWT Payload:', payload);
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, status: true },
        });

        if (!user) {
            console.log('[DEBUG] User not found in DB for sub:', payload.sub);
            // Check if any users exist at all
            const count = await this.prisma.user.count();
            console.log('[DEBUG] Total users in DB:', count);
        } else {
            console.log('[DEBUG] User validated:', user.email, 'Role:', user.role);
        }

        return user;
    }
}
