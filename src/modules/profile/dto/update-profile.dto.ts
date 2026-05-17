import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsIn(['BRL', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn(['dark', 'light', 'system'])
  theme?: string;
}
