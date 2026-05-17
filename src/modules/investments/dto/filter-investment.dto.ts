import { IsEnum, IsOptional } from 'class-validator';
import { InvestmentType } from 'src/generated/prisma/enums';

export class FilterInvestmentDto {
  @IsOptional()
  @IsEnum(InvestmentType)
  type?: InvestmentType;
}
