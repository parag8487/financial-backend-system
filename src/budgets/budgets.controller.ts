import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/budget.dto';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('budgets')
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) { }

    @Get()
    @ApiOperation({ summary: 'List all budgeting goals for the current user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'List of budgets' })
    async findAll(@CurrentUser() user: AuthUser) {
        const budgets = await this.budgetsService.findAll(user);
        return { success: true, data: budgets };
    }

    @Post()
    @ApiOperation({ summary: 'Set or update a budget for a category' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Budget set successfully' })
    async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBudgetDto) {
        const budget = await this.budgetsService.create(user, dto);
        return { success: true, data: budget };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove a budget goal' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Budget removed' })
    async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.budgetsService.remove(user, id);
        return { success: true, message: 'Budget removed successfully' };
    }
}
