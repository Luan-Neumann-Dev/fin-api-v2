import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/common/types/current-user.type';
import { CreatePiggyBankDto } from './dto/create-piggy-bank.dto';
import { MovePiggyBankAmountDto } from './dto/move-piggy-bank-amount.dto';
import { UpdatePiggyBankDto } from './dto/update-piggy-bank.dto';
import { PiggyBanksService } from './piggy-banks.service';

@Controller('piggy-banks')
export class PiggyBanksController {
  constructor(private readonly piggyBanksService: PiggyBanksService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.piggyBanksService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.piggyBanksService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePiggyBankDto,
  ) {
    return this.piggyBanksService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePiggyBankDto,
  ) {
    return this.piggyBanksService.update(user.id, id, dto);
  }

  @Post(':id/deposit')
  deposit(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: MovePiggyBankAmountDto,
  ) {
    return this.piggyBanksService.deposit(user.id, id, dto);
  }

  @Post(':id/withdraw')
  withdraw(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: MovePiggyBankAmountDto,
  ) {
    return this.piggyBanksService.withdraw(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.piggyBanksService.remove(user.id, id);
  }
}