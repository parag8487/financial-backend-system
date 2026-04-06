import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction): void {
        const { method, originalUrl } = req;
        const userAgent = req.get('user-agent') || '';
        const start = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - start;
            const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${userAgent}`;

            if (statusCode >= 500) {
                this.logger.error(message);
            } else if (statusCode >= 400) {
                this.logger.warn(message);
            } else {
                this.logger.log(message);
            }
        });

        next();
    }
}
