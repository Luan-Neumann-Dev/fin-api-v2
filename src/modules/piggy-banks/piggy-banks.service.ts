import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePiggyBankDto } from './dto/create-piggy-bank.dto';
import { MovePiggyBankAmountDto } from './dto/move-piggy-bank-amount.dto';
import { UpdatePiggyBankDto } from './dto/update-piggy-bank.dto';

const piggyBankSelect = {
  id: true,
  userId: true,
  name: true,
  targetAmount: true,
  currentAmount: true,
  icon: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class PiggyBanksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const piggyBanks = await this.prisma.piggyBank.findMany({
      where: { userId },
      select: piggyBankSelect,
      orderBy: { createdAt: 'desc' },
    });

    return ApiResponse.ok(piggyBanks, 'Piggy banks retrieved', {
      total: piggyBanks.length,
    });
  }

  async findOne(userId: string, id: string) {
    const piggyBank = await this.prisma.piggyBank.findFirst({
      where: { id, userId },
      select: piggyBankSelect,
    });

    if (!piggyBank) {
      throw new NotFoundException('Piggy bank not found');
    }

    return ApiResponse.ok(piggyBank, 'Piggy bank retrieved');
  }

  async create(userId: string, dto: CreatePiggyBankDto) {
    const piggyBank = await this.prisma.piggyBank.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        icon: dto.icon,
      },
      select: piggyBankSelect,
    });

    return ApiResponse.created(piggyBank, 'Piggy bank created');
  }

  async update(userId: string, id: string, dto: UpdatePiggyBankDto) {
    await this.ensurePiggyBankExists(userId, id);

    const piggyBank = await this.prisma.piggyBank.update({
      where: { id },
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        icon: dto.icon,
      },
      select: piggyBankSelect,
    });

    return ApiResponse.ok(piggyBank, 'Piggy bank updated', {
      completed: this.isCompleted(piggyBank),
    });
  }

  async deposit(userId: string, id: string, dto: MovePiggyBankAmountDto) {
    await this.ensurePiggyBankExists(userId, id);

    const piggyBank = await this.prisma.piggyBank.update({
      where: { id },
      data: {
        currentAmount: {
          increment: dto.amount,
        },
      },
      select: piggyBankSelect,
    });

    return ApiResponse.ok(piggyBank, 'Deposit completed', {
      completed: this.isCompleted(piggyBank),
    });
  }

  async withdraw(userId: string, id: string, dto: MovePiggyBankAmountDto) {
    const currentPiggyBank = await this.ensurePiggyBankExists(userId, id);

    if (currentPiggyBank.currentAmount.lessThan(dto.amount)) {
      throw new BadRequestException('Insufficient piggy bank balance');
    }

    const piggyBank = await this.prisma.piggyBank.update({
      where: { id },
      data: {
        currentAmount: {
          decrement: dto.amount,
        },
      },
      select: piggyBankSelect,
    });

    return ApiResponse.ok(piggyBank, 'Withdraw completed', {
      completed: this.isCompleted(piggyBank),
    });
  }

  async remove(userId: string, id: string) {
    await this.ensurePiggyBankExists(userId, id);

    await this.prisma.piggyBank.delete({
      where: { id },
    });

    return ApiResponse.noContent('Piggy bank deleted');
  }

  private async ensurePiggyBankExists(userId: string, id: string) {
    const piggyBank = await this.prisma.piggyBank.findFirst({
      where: { id, userId },
      select: {
        id: true,
        currentAmount: true,
        targetAmount: true,
      },
    });

    if (!piggyBank) {
      throw new NotFoundException('Piggy bank not found');
    }

    return piggyBank;
  }

  private isCompleted(piggyBank: {
    currentAmount: Prisma.Decimal;
    targetAmount: Prisma.Decimal;
  }) {
    return piggyBank.currentAmount.greaterThanOrEqualTo(piggyBank.targetAmount);
  }
}