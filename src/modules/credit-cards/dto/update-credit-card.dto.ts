import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCreditCardDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
