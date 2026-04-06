import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  CreateRecordDto,
  FilterRecordsDto,
  UpdateRecordDto,
} from './dto/record.dto';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @Roles(Role.VIEWER)
  @ApiOperation({
    summary: 'List financial records with filters & pagination (Viewer+)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return list of records.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token.',
  })
  findAll(@CurrentUser() user: AuthUser, @Query() filters: FilterRecordsDto) {
    return this.recordsService.findAll(user, filters);
  }

  @Get('export/csv')
  @Roles(Role.VIEWER)
  @ApiOperation({ summary: 'Export financial records to CSV (Viewer+)' })
  async exportCsv(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const csv = await this.recordsService.exportToCsv(user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=records-${new Date().toISOString().split('T')[0]}.csv`,
    );
    return res.send(csv);
  }

  @Post()
  @Roles(Role.ANALYST)
  @ApiOperation({ summary: 'Create a financial record (Analyst+)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Record created.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecordDto) {
    return this.recordsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ANALYST)
  @ApiOperation({
    summary: 'Update a record — own records only unless Admin (Analyst+)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Record updated.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Record not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Cannot update other user's record.",
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.recordsService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a record (Admin only)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Record deleted.',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin only.' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.recordsService.softDelete(id, user);
  }
}
