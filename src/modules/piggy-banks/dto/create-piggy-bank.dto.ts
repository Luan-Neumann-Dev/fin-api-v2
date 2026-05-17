import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreatePiggyBankDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  targetAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;
}
