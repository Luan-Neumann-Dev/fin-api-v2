import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { Prisma, PrismaClient } from 'src/generated/prisma/client';
import { InvoiceStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInvoicePurchaseDto } from './dto/create-invoice-purchase.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { UpdateInvoicePurchaseDto } from './dto/update-invoice-purchase.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

const invoiceSelect = {
  id: true,
  creditCardId: true,
  totalAmount: true,
  dueDate: true,
  closingDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creditCard: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
};

const invoiceDetailSelect = {
  ...invoiceSelect,
  purchases: {
    select: {
      id: true,
      invoiceId: true,
      description: true,
      amount: true,
      date: true,
      category: true,
      createdAt: true,
    },
    orderBy: { date: 'desc' as const },
  },
};

const purchaseSelect = {
  id: true,
  invoiceId: true,
  description: true,
  amount: true,
  date: true,
  category: true,
  createdAt: true,
};

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: FilterInvoiceDto) {
    if (filters.creditCardId) {
      await this.ensureCreditCardBelongsToUser(userId, filters.creditCardId);
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        creditCardId: filters.creditCardId,
        status: filters.status,
        creditCard: { userId },
      },
      select: invoiceSelect,
      orderBy: { dueDate: 'desc' },
    });

    return ApiResponse.ok(invoices, 'Invoices retrieved', {
      total: invoices.length,
    });
  }

  async findOne(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        creditCard: { userId },
      },
      select: invoiceDetailSelect,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return ApiResponse.ok(invoice, 'Invoice retrieved');
  }

  async create(userId: string, dto: CreateInvoiceDto) {
    await this.ensureCreditCardBelongsToUser(userId, dto.creditCardId);

    const invoice = await this.prisma.invoice.create({
      data: {
        creditCardId: dto.creditCardId,
        dueDate: new Date(dto.dueDate),
        closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined,
        status: dto.status ?? InvoiceStatus.open,
      },
      select: invoiceSelect,
    });

    return ApiResponse.created(invoice, 'Invoice created');
  }

  async update(userId: string, id: string, dto: UpdateInvoiceDto) {
    await this.ensureInvoiceBelongsToUser(userId, id);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined,
        status: dto.status,
      },
      select: invoiceSelect,
    });

    return ApiResponse.ok(invoice, 'Invoice updated');
  }

  async remove(userId: string, id: string) {
    await this.ensureInvoiceBelongsToUser(userId, id);

    await this.prisma.invoice.delete({
      where: { id },
    });

    return ApiResponse.noContent('Invoice deleted');
  }

  async addPurchase(
    userId: string,
    invoiceId: string,
    dto: CreateInvoicePurchaseDto,
  ) {
    await this.ensureInvoiceBelongsToUser(userId, invoiceId);

    const result = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.invoicePurchase.create({
        data: {
          invoiceId,
          description: dto.description,
          amount: dto.amount,
          date: new Date(dto.date),
          category: dto.category,
        },
        select: purchaseSelect,
      });

      const invoice = await this.recalculateTotalAmount(tx, invoiceId);

      return { purchase, invoice };
    });

    return ApiResponse.created(result, 'Invoice purchase created');
  }

  async updatePurchase(
    userId: string,
    invoiceId: string,
    purchaseId: string,
    dto: UpdateInvoicePurchaseDto,
  ) {
    await this.ensureInvoiceBelongsToUser(userId, invoiceId);
    await this.ensurePurchaseBelongsToInvoice(invoiceId, purchaseId);

    const result = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.invoicePurchase.update({
        where: { id: purchaseId },
        data: {
          description: dto.description,
          amount: dto.amount,
          date: dto.date ? new Date(dto.date) : undefined,
          category: dto.category,
        },
        select: purchaseSelect,
      });

      const invoice = await this.recalculateTotalAmount(tx, invoiceId);

      return { purchase, invoice };
    });

    return ApiResponse.ok(result, 'Invoice purchase updated');
  }

  async removePurchase(userId: string, invoiceId: string, purchaseId: string) {
    await this.ensureInvoiceBelongsToUser(userId, invoiceId);
    await this.ensurePurchaseBelongsToInvoice(invoiceId, purchaseId);

    const invoice = await this.prisma.$transaction(async (tx) => {
      await tx.invoicePurchase.delete({
        where: { id: purchaseId },
      });

      return this.recalculateTotalAmount(tx, invoiceId);
    });

    return ApiResponse.ok(invoice, 'Invoice purchase deleted');
  }

  private async ensureCreditCardBelongsToUser(
    userId: string,
    creditCardId: string,
  ) {
    const creditCard = await this.prisma.creditCard.findFirst({
      where: { id: creditCardId, userId },
      select: { id: true },
    });

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    return creditCard;
  }

  private async ensureInvoiceBelongsToUser(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        creditCard: { userId },
      },
      select: { id: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private async ensurePurchaseBelongsToInvoice(
    invoiceId: string,
    purchaseId: string,
  ) {
    const purchase = await this.prisma.invoicePurchase.findFirst({
      where: { id: purchaseId, invoiceId },
      select: { id: true },
    });

    if (!purchase) {
      throw new NotFoundException('Invoice purchase not found');
    }

    return purchase;
  }

  private async recalculateTotalAmount(
    tx: TransactionClient,
    invoiceId: string,
  ) {
    const total = await tx.invoicePurchase.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: total._sum.amount ?? new Prisma.Decimal(0),
      },
      select: invoiceDetailSelect,
    });
  }
}
