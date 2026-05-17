import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';

const creditCardSelect = {
  id: true,
  userId: true,
  name: true,
  color: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class CreditCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const creditCards = await this.prisma.creditCard.findMany({
      where: { userId },
      select: creditCardSelect,
      orderBy: { createdAt: 'desc' },
    });

    return ApiResponse.ok(creditCards, 'Credit cards retrieved', {
      total: creditCards.length,
    });
  }

  async findOne(userId: string, id: string) {
    const creditCard = await this.prisma.creditCard.findFirst({
      where: { id, userId },
      select: creditCardSelect,
    });

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    return ApiResponse.ok(creditCard, 'Credit card retrieved');
  }

  async create(userId: string, dto: CreateCreditCardDto) {
    const creditCard = await this.prisma.creditCard.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color,
      },
      select: creditCardSelect,
    });

    return ApiResponse.created(creditCard, 'Credit card created');
  }

  async update(userId: string, id: string, dto: UpdateCreditCardDto) {
    await this.ensureCreditCardExists(userId, id);

    const creditCard = await this.prisma.creditCard.update({
      where: { id },
      data: {
        name: dto.name,
        color: dto.color,
      },
      select: creditCardSelect,
    });

    return ApiResponse.ok(creditCard, 'Credit card updated');
  }

  async remove(userId: string, id: string) {
    await this.ensureCreditCardExists(userId, id);

    await this.prisma.creditCard.delete({
      where: { id },
    });

    return ApiResponse.noContent('Credit card deleted');
  }

  private async ensureCreditCardExists(userId: string, id: string) {
    const creditCard = await this.prisma.creditCard.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    return creditCard;
  }
}
