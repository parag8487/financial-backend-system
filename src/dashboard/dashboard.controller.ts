import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VIEWER)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('summary')
    @ApiOperation({ summary: 'Total income, expenses, net balance (Isolated)' })
    getSummary(@CurrentUser() user: AuthUser) {
        return this.dashboardService.getSummary(user);
    }

    @Get('by-category')
    @ApiOperation({ summary: 'Income and expense aggregated by category (Isolated)' })
    getByCategory(@CurrentUser() user: AuthUser) {
        return this.dashboardService.getByCategory(user);
    }

    @Get('trends')
    @ApiOperation({ summary: 'Income/expense trends — weekly or monthly (Isolated)' })
    @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
    getTrends(@CurrentUser() user: AuthUser, @Query('period') period?: 'weekly' | 'monthly') {
        return this.dashboardService.getTrends(user, period ?? 'monthly');
    }

    @Get('recent')
    @ApiOperation({ summary: 'Last 10 financial records (Isolated)' })
    getRecent(@CurrentUser() user: AuthUser) {
        return this.dashboardService.getRecent(user);
    }

    @Get('budget-status')
    @ApiOperation({ summary: 'Current spending vs Budget goals (Isolated)' })
    getBudgetStatus(@CurrentUser() user: AuthUser) {
        return this.dashboardService.getBudgetStatus(user);
    }
}
