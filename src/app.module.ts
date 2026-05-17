import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CategoryModule } from './modules/category/category.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { PiggyBanksModule } from './modules/piggy-banks/piggy-banks.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { CreditCardsModule } from './modules/credit-cards/credit-cards.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    CategoryModule,
    TransactionsModule,
    IncomesModule,
    PiggyBanksModule,
    InvestmentsModule,
    CreditCardsModule,
    InvoicesModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
