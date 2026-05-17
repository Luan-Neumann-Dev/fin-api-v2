import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/common/types/current-user.type';
import { DashboardService } from './dashboard.service';
import { DashboardPeriodDto } from './dto/dashboard-period.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: CurrentUserPayload,
    @Query() period: DashboardPeriodDto,
  ) {
    return this.dashboardService.summary(user.id, period);
  }

  @Get('categories')
  categories(
    @CurrentUser() user: CurrentUserPayload,
    @Query() period: DashboardPeriodDto,
  ) {
    return this.dashboardService.categories(user.id, period);
  }

  @Get('alerts')
  alerts(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.alerts(user.id);
  }
}
