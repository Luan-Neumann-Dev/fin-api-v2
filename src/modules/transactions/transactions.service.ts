import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { ExpenseStatus, ExpenseType, Prisma } from 'src/generated/prisma/client';
import { ApiResponse } from 'src/common/response/api-response';

const transactionSelect = {
  id: true,
  userId: true,
  description: true,
  amount: true,
  date: true,
  categoryId: true,
  type: true,
  status: true,
  installmentInfo: true,
  totalInstallments: true,
  installmentNumber: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: FilterTransactionDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      status: filters.status,
      type: filters.type,
      categoryId: filters.categoryId,
      date: this.buildDateFilter(filters.month, filters.year),
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: transactionSelect,
      orderBy: { date: 'desc' },
    });

    return ApiResponse.ok(transactions, 'Transactions retrieved', {
      total: transactions.length
    })
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: transactionSelect,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return ApiResponse.ok(transaction, 'Transaction retrieved');
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.ensureCategoryBelongsToUser(userId, dto.categoryId);

    const type = dto.type ??ExpenseType.variable;
    const status = dto.status ?? ExpenseStatus.pending;

    if (type === ExpenseType.installment) {
      return this.createInstallments(userId, dto);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        type,
        status
      },
      select: transactionSelect
    })

    return ApiResponse.created(transaction, 'Transaction created');
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.ensureTransactionExists(userId, id);
    await this.ensureCategoryBelongsToUser(userId, dto.categoryId);

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        description: dto.description,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        categoryId: dto.categoryId,
        type: dto.type,
        status: dto.status,
        totalInstallments: dto.totalInstallments,
      },
      select: transactionSelect,
    });

    return ApiResponse.ok(transaction, 'Transaction updated');
  }

  async pay(userId: string, id: string) {
    await this.ensureTransactionExists(userId, id);

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: { status: ExpenseStatus.paid },
      select: transactionSelect, 
    });

    return ApiResponse.ok(transaction, 'Transaction paid');
  }

  async remove(userId: string, id: string) {
    await this.ensureTransactionExists(userId, id);

    await this.prisma.transaction.delete({
      where: { id }
    });

    return ApiResponse.noContent('Transaction deleted');
  }

   private async createInstallments(userId: string, dto: CreateTransactionDto) {
    if (!dto.totalInstallments) {
      throw new BadRequestException(
        'totalInstallments is required for installment transactions',
      );
    }

    const baseDate = new Date(dto.date);
    const installmentData = Array.from(
      { length: dto.totalInstallments },
      (_, index) => {
        const installmentNumber = index + 1;
        const date = new Date(baseDate);
        date.setMonth(baseDate.getMonth() + index);

        return {
          userId,
          description: dto.description,
          amount: dto.amount,
          date,
          categoryId: dto.categoryId,
          type: ExpenseType.installment,
          status: ExpenseStatus.pending,
          installmentInfo: `${installmentNumber}/${dto.totalInstallments}`,
          totalInstallments: dto.totalInstallments,
          installmentNumber,
        };
      },
    );

    const transactions = await this.prisma.$transaction(
      installmentData.map((data) =>
        this.prisma.transaction.create({
          data,
          select: transactionSelect,
        }),
      ),
    );

    return ApiResponse.created(transactions, 'Installment transactions created');
  }

  private async ensureTransactionExists(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  private async ensureCategoryBelongsToUser(userId: string, categoryId?: string) {
    if (!categoryId) return;

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private buildDateFilter(month?: number, year?: number) {
    if (!month && !year) return undefined;

    if (month && !year) {
      throw new BadRequestException('year is required when month is provided');
    }

    if (year && !month) {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      return {
        gte: start,
        lt: end
      };
    }

    const start = new Date(year!, month! - 1, 1);
    const end = new Date(year!, month!, 1);

    return {
      gte: start,
      lt: end,
    };
  }
}
