import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { FilterInvestmentDto } from './dto/filter-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';

const investmentSelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  investedAmount: true,
  currentAmount: true,
  createdAt: true,
  updatedAt: true,
};

type InvestmentWithAmounts = {
  investedAmount: Prisma.Decimal;
  currentAmount: Prisma.Decimal;
};

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: FilterInvestmentDto) {
    const investments = await this.prisma.investment.findMany({
      where: {
        userId,
        type: filters.type,
      },
      select: investmentSelect,
      orderBy: { createdAt: 'desc' },
    });

    return ApiResponse.ok(
      investments.map((investment) => this.withPerformance(investment)),
      'Investments retrieved',
      { total: investments.length },
    );
  }

  async findOne(userId: string, id: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id, userId },
      select: investmentSelect,
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return ApiResponse.ok(
      this.withPerformance(investment),
      'Investment retrieved',
    );
  }

  async create(userId: string, dto: CreateInvestmentDto) {
    const investment = await this.prisma.investment.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        investedAmount: dto.investedAmount,
        currentAmount: dto.currentAmount,
      },
      select: investmentSelect,
    });

    return ApiResponse.created(
      this.withPerformance(investment),
      'Investment created',
    );
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto) {
    await this.ensureInvestmentExists(userId, id);

    const investment = await this.prisma.investment.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        investedAmount: dto.investedAmount,
        currentAmount: dto.currentAmount,
      },
      select: investmentSelect,
    });

    return ApiResponse.ok(
      this.withPerformance(investment),
      'Investment updated',
    );
  }

  async remove(userId: string, id: string) {
    await this.ensureInvestmentExists(userId, id);

    await this.prisma.investment.delete({
      where: { id },
    });

    return ApiResponse.noContent('Investment deleted');
  }

  private async ensureInvestmentExists(userId: string, id: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  private withPerformance<T extends InvestmentWithAmounts>(investment: T) {
    const investedAmount = investment.investedAmount.toNumber();
    const currentAmount = investment.currentAmount.toNumber();
    const profit = currentAmount - investedAmount;
    const profitPercent =
      investedAmount > 0 ? Number(((profit / investedAmount) * 100).toFixed(2)) : 0;

    return {
      ...investment,
      profit,
      profitPercent,
    };
  }
}
