import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { InvestmentType } from 'src/generated/prisma/enums';

export class UpdateInvestmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(InvestmentType)
  type?: InvestmentType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  investedAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  currentAmount?: number;
}
