import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardPeriodDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;
}
