import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ApiResponse } from "src/common/response/api-response";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

const userSelect = {
  id: true, 
  email: true,
  displayName: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (emailOwner && emailOwner.id !== userId) {
        throw new ConflictException('Email already registered');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        displayName: dto.displayName,
      },
      select: userSelect,
    });

    return ApiResponse.ok(user, 'User updated');
  }
}