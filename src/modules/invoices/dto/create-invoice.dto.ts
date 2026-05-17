import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InvoiceStatus } from 'src/generated/prisma/enums';

export class CreateInvoiceDto {
  @IsUUID()
  creditCardId: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
