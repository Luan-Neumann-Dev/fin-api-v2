import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePiggyBankDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  targetAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;
}
