import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterIncomeDto } from './dto/filter-income.dto';
import { IncomeType, Prisma } from 'src/generated/prisma/client';
import { ApiResponse } from 'src/common/response/api-response';

const incomeSelect = {
  id: true,
  userId: true,
  name: true,
  amount: true,
  date: true,
  type: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: FilterIncomeDto) {
    const where: Prisma.IncomeWhereInput = {
      userId,
      type: filters.type,
      date: this.buildDateFilter(filters.month, filters.year),
    };

    const incomes = await this.prisma.income.findMany({
      where,
      select: incomeSelect,
      orderBy: { date: 'desc' },
    });

    return ApiResponse.ok(incomes, 'Incomes retrieved', {
      total: incomes.length,
    });
  }

  async findOne(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: { id, userId },
      select: incomeSelect,
    });

    if (!income) {
      throw new NotFoundException('Income not found');
    }

    return ApiResponse.ok(income, 'Income retrieved');
  }

  async create(userId: string, dto: CreateIncomeDto) {
    const income = await this.prisma.income.create({
      data: {
        userId,
        name: dto.name,
        amount: dto.amount,
        date: new Date(dto.date),
        type: dto.type ?? IncomeType.fixed,
      },
      select: incomeSelect,
    });

    return ApiResponse.created(income, 'Income created');
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto) {
    await this.ensureIncomeExists(userId, id);

    const income = await this.prisma.income.update({
      where: { id },
      data: {
        name: dto.name,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        type: dto.type,
      },
      select: incomeSelect,
    });

    return ApiResponse.ok(income, 'Income created');
  }

  async remove(userId: string, id: string) {
    await this.ensureIncomeExists(userId, id);

    await this.prisma.income.delete({
      where: { id },
    });

    return ApiResponse.noContent('Income deleted');
  }

  private async ensureIncomeExists(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!income) {
      throw new NotFoundException('Income not found');
    }

    return income;
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
}
