import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateInvoicePurchaseDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
