import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { InvestmentType } from 'src/generated/prisma/enums';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InvestmentType)
  type: InvestmentType;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  investedAmount: number;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  currentAmount: number;
}
