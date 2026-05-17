import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { InvoiceStatus } from 'src/generated/prisma/enums';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
