import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { Prisma } from 'src/generated/prisma/client';
import { ExpenseStatus, InvoiceStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardPeriodDto } from './dto/dashboard-period.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, period: DashboardPeriodDto) {
    const dateFilter = this.buildDateFilter(period.month, period.year);

    const [
      incomesTotal,
      expensesTotal,
      paidExpensesTotal,
      pendingExpensesTotal,
      piggyBanksTotal,
      investmentsTotal,
      openInvoicesTotal,
    ] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId, date: dateFilter },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, date: dateFilter },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, date: dateFilter, status: ExpenseStatus.paid },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, date: dateFilter, status: ExpenseStatus.pending },
        _sum: { amount: true },
      }),
      this.prisma.piggyBank.aggregate({
        where: { userId },
        _sum: { currentAmount: true },
      }),
      this.prisma.investment.aggregate({
        where: { userId },
        _sum: {
          investedAmount: true,
          currentAmount: true,
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.open,
          creditCard: { userId },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalIncomes = this.toNumber(incomesTotal._sum.amount);
    const totalExpenses = this.toNumber(expensesTotal._sum.amount);
    const totalPaidExpenses = this.toNumber(paidExpensesTotal._sum.amount);
    const totalPendingExpenses = this.toNumber(
      pendingExpensesTotal._sum.amount,
    );
    const piggyBanksBalance = this.toNumber(
      piggyBanksTotal._sum.currentAmount,
    );
    const investedAmount = this.toNumber(
      investmentsTotal._sum.investedAmount,
    );
    const investmentsCurrentAmount = this.toNumber(
      investmentsTotal._sum.currentAmount,
    );
    const openInvoicesAmount = this.toNumber(
      openInvoicesTotal._sum.totalAmount,
    );

    return ApiResponse.ok(
      {
        totalIncomes,
        totalExpenses,
        balance: totalIncomes - totalExpenses,
        totalPaidExpenses,
        totalPendingExpenses,
        piggyBanksBalance,
        investedAmount,
        investmentsCurrentAmount,
        investmentsProfit: investmentsCurrentAmount - investedAmount,
        openInvoicesAmount,
      },
      'Dashboard summary retrieved',
    );
  }

  async categories(userId: string, period: DashboardPeriodDto) {
    const dateFilter = this.buildDateFilter(period.month, period.year);

    const groupedTransactions = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: dateFilter,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    const categoryIds = groupedTransactions
      .map((group) => group.categoryId)
      .filter((categoryId): categoryId is string => Boolean(categoryId));

    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        userId,
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const categoriesById = new Map(
      categories.map((category) => [category.id, category]),
    );

    const data = groupedTransactions.map((group) => {
      const category = group.categoryId
        ? categoriesById.get(group.categoryId)
        : null;

      return {
        categoryId: group.categoryId,
        categoryName: category?.name ?? 'Uncategorized',
        color: category?.color ?? '#64748b',
        totalAmount: this.toNumber(group._sum.amount),
        totalTransactions: group._count.id,
      };
    });

    return ApiResponse.ok(data, 'Dashboard categories retrieved', {
      total: data.length,
    });
  }

  async alerts(userId: string) {
    const today = this.startOfDay(new Date());
    const nextSevenDays = new Date(today);
    nextSevenDays.setDate(today.getDate() + 7);

    const [overdueInvoices, dueSoonInvoices] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          dueDate: { lt: today },
          status: { not: InvoiceStatus.closed },
          creditCard: { userId },
        },
        select: this.alertInvoiceSelect(),
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.invoice.findMany({
        where: {
          dueDate: {
            gte: today,
            lte: nextSevenDays,
          },
          status: { not: InvoiceStatus.closed },
          creditCard: { userId },
        },
        select: this.alertInvoiceSelect(),
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return ApiResponse.ok(
      {
        overdueInvoices,
        dueSoonInvoices,
      },
      'Dashboard alerts retrieved',
      {
        overdue: overdueInvoices.length,
        dueSoon: dueSoonInvoices.length,
      },
    );
  }

  private buildDateFilter(month?: number, year?: number) {
    if (!month && !year) return undefined;

    if (month && !year) {
      throw new BadRequestException('year is required when month is provided');
    }

    if (year && !month) {
      return {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }

    return {
      gte: new Date(year!, month! - 1, 1),
      lt: new Date(year!, month!, 1),
    };
  }

  private alertInvoiceSelect() {
    return {
      id: true,
      creditCardId: true,
      totalAmount: true,
      dueDate: true,
      status: true,
      creditCard: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    };
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toNumber(value?: Prisma.Decimal | null) {
    return value?.toNumber() ?? 0;
  }
}
