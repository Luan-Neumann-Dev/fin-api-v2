import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthsQueryDto } from './dto/months-query.dto';
import { ReportPeriodDto } from './dto/report-period.dto';

type MonthlyReportItem = {
  month: number;
  year: number;
  label: string;
  incomes: number;
  expenses: number;
  balance: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async cashflow(userId: string, query: MonthsQueryDto) {
    const months = query.months ?? 6;
    const periods = this.getLastMonths(months);
    const { start, end } = this.getRangeFromPeriods(periods);

    const [incomes, transactions] = await Promise.all([
      this.prisma.income.findMany({
        where: {
          userId,
          date: { gte: start, lt: end },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lt: end },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
    ]);

    const report = this.createEmptyMonthlyReport(periods);
    const byKey = new Map(report.map((item) => [this.periodKey(item), item]));

    for (const income of incomes) {
      const item = byKey.get(this.dateKey(income.date));
      if (item) item.incomes += this.toNumber(income.amount);
    }

    for (const transaction of transactions) {
      const item = byKey.get(this.dateKey(transaction.date));
      if (item) item.expenses += this.toNumber(transaction.amount);
    }

    for (const item of report) {
      item.balance = item.incomes - item.expenses;
      item.incomes = this.roundMoney(item.incomes);
      item.expenses = this.roundMoney(item.expenses);
      item.balance = this.roundMoney(item.balance);
    }

    return ApiResponse.ok(report, 'Cashflow report retrieved', {
      months,
    });
  }

  async monthlyEvolution(userId: string, query: MonthsQueryDto) {
    const cashflowResponse = await this.cashflow(userId, query);
    const cashflow = cashflowResponse.data ?? [];

    const [piggyBanksTotal, investmentsTotal] = await Promise.all([
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
    ]);

    let accumulatedBalance = 0;
    const piggyBanksBalance = this.toNumber(piggyBanksTotal._sum.currentAmount);
    const investmentsCurrentAmount = this.toNumber(
      investmentsTotal._sum.currentAmount,
    );
    const investedAmount = this.toNumber(investmentsTotal._sum.investedAmount);

    const report = cashflow.map((item) => {
      accumulatedBalance += item.balance;

      return {
        ...item,
        accumulatedBalance: this.roundMoney(accumulatedBalance),
        piggyBanksBalance,
        investedAmount,
        investmentsCurrentAmount,
        estimatedNetWorth: this.roundMoney(
          accumulatedBalance + piggyBanksBalance + investmentsCurrentAmount,
        ),
      };
    });

    return ApiResponse.ok(report, 'Monthly evolution report retrieved', {
      months: query.months ?? 6,
    });
  }

  async categories(userId: string, period: ReportPeriodDto) {
    const dateFilter = this.buildDateFilter(period);

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

    const totalAmount = groupedTransactions.reduce(
      (total, group) => total + this.toNumber(group._sum.amount),
      0,
    );

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
      const amount = this.toNumber(group._sum.amount);
      const category = group.categoryId
        ? categoriesById.get(group.categoryId)
        : null;

      return {
        categoryId: group.categoryId,
        categoryName: category?.name ?? 'Uncategorized',
        color: category?.color ?? '#64748b',
        totalAmount: this.roundMoney(amount),
        totalTransactions: group._count.id,
        percentage:
          totalAmount > 0
            ? this.roundMoney((amount / totalAmount) * 100)
            : 0,
      };
    });

    return ApiResponse.ok(data, 'Categories report retrieved', {
      total: data.length,
      totalAmount: this.roundMoney(totalAmount),
    });
  }

  private buildDateFilter(period: ReportPeriodDto) {
    if (period.startDate || period.endDate) {
      return {
        gte: period.startDate ? new Date(period.startDate) : undefined,
        lte: period.endDate ? new Date(period.endDate) : undefined,
      };
    }

    if (!period.month && !period.year) return undefined;

    if (period.month && !period.year) {
      throw new BadRequestException('year is required when month is provided');
    }

    if (period.year && !period.month) {
      return {
        gte: new Date(period.year, 0, 1),
        lt: new Date(period.year + 1, 0, 1),
      };
    }

    return {
      gte: new Date(period.year!, period.month! - 1, 1),
      lt: new Date(period.year!, period.month!, 1),
    };
  }

  private getLastMonths(months: number) {
    const now = new Date();

    return Array.from({ length: months }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);

      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    }).reverse();
  }

  private getRangeFromPeriods(periods: Array<{ month: number; year: number }>) {
    const first = periods[0];
    const last = periods[periods.length - 1];

    return {
      start: new Date(first.year, first.month - 1, 1),
      end: new Date(last.year, last.month, 1),
    };
  }

  private createEmptyMonthlyReport(
    periods: Array<{ month: number; year: number }>,
  ): MonthlyReportItem[] {
    return periods.map((period) => ({
      ...period,
      label: `${period.year}-${String(period.month).padStart(2, '0')}`,
      incomes: 0,
      expenses: 0,
      balance: 0,
    }));
  }

  private dateKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  private periodKey(period: { month: number; year: number }) {
    return `${period.year}-${period.month}`;
  }

  private roundMoney(value: number) {
    return Number(value.toFixed(2));
  }

  private toNumber(value?: Prisma.Decimal | null) {
    return value?.toNumber() ?? 0;
  }
}
