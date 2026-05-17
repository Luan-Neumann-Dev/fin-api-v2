import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/common/types/current-user.type';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.categoryService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createCategoryDto: CreateCategoryDto
  ) {
    return this.categoryService.create(user.id, createCategoryDto);
  }


  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.update(user.id, id, updateCategoryDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() userId: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.categoryService.remove(userId.id, id);
  }
}
