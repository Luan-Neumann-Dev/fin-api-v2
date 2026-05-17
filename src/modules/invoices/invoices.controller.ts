import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/common/types/current-user.type';
import { CreateInvoicePurchaseDto } from './dto/create-invoice-purchase.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { UpdateInvoicePurchaseDto } from './dto/update-invoice-purchase.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filters: FilterInvoiceDto,
  ) {
    return this.invoicesService.findAll(user.id, filters);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.invoicesService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.invoicesService.remove(user.id, id);
  }

  @Post(':id/purchases')
  addPurchase(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateInvoicePurchaseDto,
  ) {
    return this.invoicesService.addPurchase(user.id, id, dto);
  }

  @Patch(':id/purchases/:purchaseId')
  updatePurchase(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('purchaseId') purchaseId: string,
    @Body() dto: UpdateInvoicePurchaseDto,
  ) {
    return this.invoicesService.updatePurchase(user.id, id, purchaseId, dto);
  }

  @Delete(':id/purchases/:purchaseId')
  removePurchase(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.invoicesService.removePurchase(user.id, id, purchaseId);
  }
}
