import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from 'src/common/response/api-response';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const profileSelect = {
  id: true,
  userId: true,
  currency: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return ApiResponse.ok(profile, 'Profile retrieved');
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existingProfile) {
      throw new NotFoundException('Profile not found');
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        currency: dto.currency,
        theme: dto.theme,
      },
      select: profileSelect,
    });

    return ApiResponse.ok(profile, 'Profile updated');
  }
}
