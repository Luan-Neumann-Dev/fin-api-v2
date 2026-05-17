import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/common/response/api-response';

const categorySelect = {
  id: true,
  userId: true,
  name: true,
  color: true,
  createdAt: true,
};

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      select: categorySelect,
      orderBy: { name: 'asc' },
    });

    return ApiResponse.ok(categories, 'Categories retrieved', {
      total: categories.length,
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const { name, color } = dto;

    const existingCategory = await this.prisma.category.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
      select: { id: true },
    });

    if (existingCategory) {
      throw new ConflictException('Category already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        userId,
        name,
        color,
      },
      select: categorySelect,
    });

    return ApiResponse.created(category, 'Category created');
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureCategoryExists(userId, id);

    const { name, color } = dto;

    if (name) {
      const categoryWithSameName = await this.prisma.category.findUnique({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
        select: { id: true },
      });

      if (categoryWithSameName && categoryWithSameName.id !== id) {
        throw new ConflictException('Category already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name,
        color,
      },
      select: categorySelect,
    });

    return ApiResponse.ok(category, 'Category updated');
  }

  async remove(userId: string, id: string) {
    await this.ensureCategoryExists(userId, id);

    await this.prisma.category.delete({
      where: { id },
    });

    return ApiResponse.noContent('Category deleted');
  }

  private async ensureCategoryExists(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }
}
