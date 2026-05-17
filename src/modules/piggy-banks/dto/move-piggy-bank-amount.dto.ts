import { Type } from "class-transformer";
import { IsNumber, IsPositive } from "class-validator";

export class MovePiggyBankAmountDto {
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  amount: number;
}