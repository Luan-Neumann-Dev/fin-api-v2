import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/common/types/current-user.type';
import { MonthsQueryDto } from './dto/months-query.dto';
import { ReportPeriodDto } from './dto/report-period.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('cashflow')
  cashflow(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: MonthsQueryDto,
  ) {
    return this.reportsService.cashflow(user.id, query);
  }

  @Get('monthly-evolution')
  monthlyEvolution(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: MonthsQueryDto,
  ) {
    return this.reportsService.monthlyEvolution(user.id, query);
  }

  @Get('categories')
  categories(
    @CurrentUser() user: CurrentUserPayload,
    @Query() period: ReportPeriodDto,
  ) {
    return this.reportsService.categories(user.id, period);
  }
}
