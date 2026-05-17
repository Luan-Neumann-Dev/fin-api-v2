import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InvoiceStatus } from 'src/generated/prisma/enums';

export class FilterInvoiceDto {
  @IsOptional()
  @IsUUID()
  creditCardId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
