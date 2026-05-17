import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateInvoicePurchaseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}
