# ClearFlow Finance — Plano de Implementação da API

> Stack: NestJS + TypeScript + JWT + class-validator/transformer + Prisma + PostgreSQL (Docker)
> Uso pessoal (single user), sem multitenancy.

---

## 1. Visão Geral do Projeto

Sistema de gestão financeira pessoal com as seguintes entidades principais:

- **User** — autenticação
- **Profile** — configurações do usuário (currency, theme, etc.)
- **Transaction** (Despesas) — fixas, variáveis, parceladas
- **Income** (Receitas) — fixas e variáveis
- **CreditCard** — cartões de crédito cadastrados
- **Invoice** (Faturas) — faturas dos cartões
- **InvoicePurchase** — compras dentro de uma fatura
- **PiggyBank** (Cofrinhos) — metas de economia
- **Investment** (Investimentos) — carteira de investimentos
- **Category** — categorias de despesas com cor

---

## 2. Estrutura de Pastas

```
src/
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts       ← envolve tudo em ApiResponse
│   ├── filters/
│   │   └── http-exception.filter.ts       ← erros padronizados em ApiResponse
│   └── response/
│       └── api-response.ts                ← classe ApiResponse
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   └── dto/
│       └── update-password.dto.ts
│
├── profile/
│   ├── profile.module.ts
│   ├── profile.controller.ts
│   ├── profile.service.ts
│   └── dto/
│       └── update-profile.dto.ts
│
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── dto/
│       ├── create-category.dto.ts
│       └── update-category.dto.ts
│
├── transactions/
│   ├── transactions.module.ts
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   └── dto/
│       ├── create-transaction.dto.ts
│       ├── update-transaction.dto.ts
│       └── filter-transaction.dto.ts
│
├── incomes/
│   ├── incomes.module.ts
│   ├── incomes.controller.ts
│   ├── incomes.service.ts
│   └── dto/
│       ├── create-income.dto.ts
│       └── update-income.dto.ts
│
├── credit-cards/
│   ├── credit-cards.module.ts
│   ├── credit-cards.controller.ts
│   ├── credit-cards.service.ts
│   └── dto/
│       ├── create-credit-card.dto.ts
│       └── update-credit-card.dto.ts
│
├── invoices/
│   ├── invoices.module.ts
│   ├── invoices.controller.ts
│   ├── invoices.service.ts
│   └── dto/
│       ├── create-invoice.dto.ts
│       ├── update-invoice.dto.ts
│       ├── create-invoice-purchase.dto.ts
│       └── update-invoice-purchase.dto.ts
│
├── piggy-banks/
│   ├── piggy-banks.module.ts
│   ├── piggy-banks.controller.ts
│   ├── piggy-banks.service.ts
│   └── dto/
│       ├── create-piggy-bank.dto.ts
│       ├── update-piggy-bank.dto.ts
│       └── deposit-piggy-bank.dto.ts
│
├── investments/
│   ├── investments.module.ts
│   ├── investments.controller.ts
│   ├── investments.service.ts
│   └── dto/
│       ├── create-investment.dto.ts
│       └── update-investment.dto.ts
│
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts
│
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   └── reports.service.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── app.module.ts
```

---

## 3. Schema Prisma (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  profile      Profile?
  transactions Transaction[]
  incomes      Income[]
  creditCards  CreditCard[]
  piggyBanks   PiggyBank[]
  investments  Investment[]
  categories   Category[]

  @@map("users")
}

model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  displayName String?  @map("display_name")
  avatarUrl   String?  @map("avatar_url")
  currency    String   @default("BRL")
  theme       String   @default("dark")   // "dark" | "light" | "system"
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Category {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  color     String   @default("#6366f1")
  createdAt DateTime @default(now()) @map("created_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, name])
  @@map("categories")
}

enum ExpenseType {
  fixed
  variable
  installment
}

enum ExpenseStatus {
  paid
  pending
}

model Transaction {
  id              String        @id @default(uuid())
  userId          String        @map("user_id")
  description     String
  amount          Decimal       @db.Decimal(12, 2)
  date            DateTime      @db.Date
  categoryId      String?       @map("category_id")
  type            ExpenseType   @default(variable)
  status          ExpenseStatus @default(pending)
  installmentInfo String?       @map("installment_info")  // ex: "3/12"
  totalInstallments Int?        @map("total_installments")
  installmentNumber Int?        @map("installment_number")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@index([userId, date])
  @@map("transactions")
}

enum IncomeType {
  fixed
  variable
}

model Income {
  id        String     @id @default(uuid())
  userId    String     @map("user_id")
  name      String
  amount    Decimal    @db.Decimal(12, 2)
  date      DateTime   @db.Date
  type      IncomeType @default(fixed)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@map("incomes")
}

model CreditCard {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  color     String   @default("#7c3aed")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices Invoice[]

  @@map("credit_cards")
}

enum InvoiceStatus {
  open
  closed
  overdue
}

model Invoice {
  id           String        @id @default(uuid())
  creditCardId String        @map("credit_card_id")
  totalAmount  Decimal       @default(0) @db.Decimal(12, 2) @map("total_amount")
  dueDate      DateTime      @db.Date @map("due_date")
  closingDate  DateTime?     @db.Date @map("closing_date")
  status       InvoiceStatus @default(open)
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  creditCard CreditCard       @relation(fields: [creditCardId], references: [id], onDelete: Cascade)
  purchases  InvoicePurchase[]

  @@map("invoices")
}

model InvoicePurchase {
  id          String   @id @default(uuid())
  invoiceId   String   @map("invoice_id")
  description String
  amount      Decimal  @db.Decimal(12, 2)
  date        DateTime @db.Date
  category    String
  createdAt   DateTime @default(now()) @map("created_at")

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@map("invoice_purchases")
}

model PiggyBank {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  name          String
  targetAmount  Decimal  @db.Decimal(12, 2) @map("target_amount")
  currentAmount Decimal  @default(0) @db.Decimal(12, 2) @map("current_amount")
  icon          String   @default("🐷")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("piggy_banks")
}

enum InvestmentType {
  stock
  fixed_income @map("fixed-income")
  crypto
  fund
}

model Investment {
  id              String         @id @default(uuid())
  userId          String         @map("user_id")
  name            String
  type            InvestmentType
  investedAmount  Decimal        @db.Decimal(12, 2) @map("invested_amount")
  currentAmount   Decimal        @db.Decimal(12, 2) @map("current_amount")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("investments")
}
```

---

## 4. Padrão `ApiResponse`

Todos os endpoints retornam este formato.

### `src/common/response/api-response.ts`

```typescript
export class ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>; // paginação, totais, etc.

  constructor(params: {
    success: boolean;
    message: string;
    data?: T | null;
    meta?: Record<string, unknown>;
  }) {
    this.success = params.success;
    this.message = params.message;
    this.data = params.data ?? null;
    this.meta = params.meta;
  }

  static ok<T>(data: T, message = 'Success', meta?: Record<string, unknown>) {
    return new ApiResponse({ success: true, message, data, meta });
  }

  static created<T>(data: T, message = 'Created') {
    return new ApiResponse({ success: true, message, data });
  }

  static noContent(message = 'Deleted') {
    return new ApiResponse({ success: true, message, data: null });
  }

  static error(message: string) {
    return new ApiResponse({ success: false, message, data: null });
  }
}
```

### `src/common/interceptors/transform.interceptor.ts`

```typescript
// Não envolve automaticamente pois já retornamos ApiResponse nos services/controllers.
// Apenas garante remoção de campos undefined.
```

### `src/common/filters/http-exception.filter.ts`

```typescript
// Captura HttpException e retorna ApiResponse.error(message) padronizado
// com o status HTTP correto.
```

**Exemplos de resposta:**

```json
// Sucesso
{ "success": true, "message": "Transactions retrieved", "data": [...], "meta": { "total": 10 } }

// Erro
{ "success": false, "message": "Invalid credentials", "data": null }

// Criado
{ "success": true, "message": "Transaction created", "data": { "id": "..." } }
```

---

## 5. Rotas da API

### Auth — `/auth`

| Método | Rota              | Descrição                  | Auth |
|--------|-------------------|----------------------------|------|
| POST   | `/auth/register`  | Cria usuário + profile     | ❌   |
| POST   | `/auth/login`     | Login, retorna JWT         | ❌   |
| GET    | `/auth/me`        | Dados do usuário logado    | ✅   |
| POST   | `/auth/logout`    | (stateless, só frontend)   | ✅   |

### Profile — `/profile`

| Método | Rota       | Descrição                              | Auth |
|--------|------------|----------------------------------------|------|
| GET    | `/profile` | Busca profile do usuário               | ✅   |
| PATCH  | `/profile` | Atualiza displayName, currency, theme  | ✅   |

### Categories — `/categories`

| Método | Rota               | Descrição          | Auth |
|--------|--------------------|--------------------|------|
| GET    | `/categories`      | Lista categorias   | ✅   |
| POST   | `/categories`      | Cria categoria     | ✅   |
| PATCH  | `/categories/:id`  | Atualiza categoria | ✅   |
| DELETE | `/categories/:id`  | Remove categoria   | ✅   |

### Transactions (Despesas) — `/transactions`

| Método | Rota                          | Descrição                      | Auth |
|--------|-------------------------------|--------------------------------|------|
| GET    | `/transactions`               | Lista (filtros: month, year, status, type, categoryId) | ✅ |
| GET    | `/transactions/:id`           | Detalhe                        | ✅   |
| POST   | `/transactions`               | Cria (se installment, gera parcelas automaticamente) | ✅ |
| PATCH  | `/transactions/:id`           | Atualiza                       | ✅   |
| PATCH  | `/transactions/:id/pay`       | Marca como pago                | ✅   |
| DELETE | `/transactions/:id`           | Remove                         | ✅   |

### Incomes (Receitas) — `/incomes`

| Método | Rota           | Descrição                             | Auth |
|--------|----------------|---------------------------------------|------|
| GET    | `/incomes`     | Lista (filtros: month, year, type)    | ✅   |
| GET    | `/incomes/:id` | Detalhe                               | ✅   |
| POST   | `/incomes`     | Cria                                  | ✅   |
| PATCH  | `/incomes/:id` | Atualiza                              | ✅   |
| DELETE | `/incomes/:id` | Remove                                | ✅   |

### Credit Cards — `/credit-cards`

| Método | Rota                 | Descrição           | Auth |
|--------|----------------------|---------------------|------|
| GET    | `/credit-cards`      | Lista cartões       | ✅   |
| POST   | `/credit-cards`      | Cria cartão         | ✅   |
| PATCH  | `/credit-cards/:id`  | Atualiza            | ✅   |
| DELETE | `/credit-cards/:id`  | Remove              | ✅   |

### Invoices (Faturas) — `/invoices`

| Método | Rota                                     | Descrição                      | Auth |
|--------|------------------------------------------|--------------------------------|------|
| GET    | `/invoices`                              | Lista (filtros: creditCardId, status) | ✅ |
| GET    | `/invoices/:id`                          | Detalhe com purchases          | ✅   |
| POST   | `/invoices`                              | Cria fatura                    | ✅   |
| PATCH  | `/invoices/:id`                          | Atualiza status/vencimento     | ✅   |
| DELETE | `/invoices/:id`                          | Remove                         | ✅   |
| POST   | `/invoices/:id/purchases`                | Adiciona compra à fatura       | ✅   |
| PATCH  | `/invoices/:id/purchases/:purchaseId`    | Atualiza compra                | ✅   |
| DELETE | `/invoices/:id/purchases/:purchaseId`    | Remove compra                  | ✅   |

> A `totalAmount` da fatura é recalculada automaticamente via Prisma ao adicionar/remover purchases.

### Piggy Banks (Cofrinhos) — `/piggy-banks`

| Método | Rota                          | Descrição                         | Auth |
|--------|-------------------------------|-----------------------------------|------|
| GET    | `/piggy-banks`                | Lista cofrinhos                   | ✅   |
| GET    | `/piggy-banks/:id`            | Detalhe                           | ✅   |
| POST   | `/piggy-banks`                | Cria cofrinho                     | ✅   |
| PATCH  | `/piggy-banks/:id`            | Atualiza nome/meta/ícone          | ✅   |
| POST   | `/piggy-banks/:id/deposit`    | Deposita valor                    | ✅   |
| POST   | `/piggy-banks/:id/withdraw`   | Saca valor                        | ✅   |
| DELETE | `/piggy-banks/:id`            | Remove                            | ✅   |

### Investments — `/investments`

| Método | Rota                | Descrição                       | Auth |
|--------|---------------------|---------------------------------|------|
| GET    | `/investments`      | Lista (filtros: type)           | ✅   |
| GET    | `/investments/:id`  | Detalhe                         | ✅   |
| POST   | `/investments`      | Cria investimento               | ✅   |
| PATCH  | `/investments/:id`  | Atualiza valor atual            | ✅   |
| DELETE | `/investments/:id`  | Remove                          | ✅   |

### Dashboard — `/dashboard`

| Método | Rota                    | Descrição                                | Auth |
|--------|-------------------------|------------------------------------------|------|
| GET    | `/dashboard/summary`    | Saldo, receitas, despesas, projetado     | ✅   |
| GET    | `/dashboard/categories` | Gastos por categoria (agregado)          | ✅   |
| GET    | `/dashboard/alerts`     | Faturas vencidas / vencendo em 7 dias    | ✅   |

Query params: `?month=4&year=2026`

### Reports — `/reports`

| Método | Rota                         | Descrição                                   | Auth |
|--------|------------------------------|---------------------------------------------|------|
| GET    | `/reports/cashflow`          | Entradas, saídas, saldo por mês             | ✅   |
| GET    | `/reports/monthly-evolution` | Evolução patrimonial (n meses)              | ✅   |
| GET    | `/reports/categories`        | Breakdown de categorias (período customizado)| ✅   |

Query params: `?month=4&year=2026` / `?months=6`

---

## 6. DTOs Principais

### `create-transaction.dto.ts`
```typescript
export class CreateTransactionDto {
  @IsString() @IsNotEmpty()
  description: string;

  @IsNumber() @Type(() => Number) @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsEnum(ExpenseStatus)
  status: ExpenseStatus;

  // Apenas para type = 'installment'
  @IsOptional() @IsInt() @Min(2) @Max(120)
  totalInstallments?: number;
}
```

> Quando `type === 'installment'`, o service cria automaticamente N registros de transação (uma por parcela), calculando datas e `installmentInfo` (ex: "1/12", "2/12"...).

### `filter-transaction.dto.ts`
```typescript
export class FilterTransactionDto {
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) @Max(12)
  month?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  year?: number;

  @IsOptional() @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional() @IsEnum(ExpenseType)
  type?: ExpenseType;

  @IsOptional() @IsUUID()
  categoryId?: string;
}
```

### `update-profile.dto.ts`
```typescript
export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100)
  displayName?: string;

  @IsOptional() @IsString() @IsIn(['BRL', 'USD', 'EUR'])
  currency?: string;

  @IsOptional() @IsString() @IsIn(['dark', 'light', 'system'])
  theme?: string;

  @IsOptional() @IsUrl()
  avatarUrl?: string;
}
```

---

## 7. Lógicas de Negócio Importantes

### 7.1 Criação de transação parcelada
Ao `POST /transactions` com `type: 'installment'` e `totalInstallments: 12`:
- O service cria 12 registros no banco em uma transação Prisma
- Cada registro tem `installmentInfo: "N/12"`, `date` incrementado em 1 mês
- Todos com `status: 'pending'`
- Retorna array com todas as parcelas criadas

### 7.2 Recálculo do `totalAmount` da fatura
Ao adicionar/remover `InvoicePurchase`:
- O service recalcula `SUM(amount)` das purchases e atualiza `Invoice.totalAmount` na mesma operação Prisma (`$transaction`)

### 7.3 Status de fatura automático
- `GET /dashboard/alerts` compara `dueDate` com `now()` para indicar `overdue` dinamicamente (ou o job de atualização pode rodar na leitura — manter simples)

### 7.4 Cofrinho deposit/withdraw
- `deposit`: soma ao `currentAmount`
- `withdraw`: subtrai, nunca abaixo de 0 (lança `BadRequestException`)
- Se `currentAmount >= targetAmount`, pode retornar flag `completed: true` no `meta`

---

## 8. Segurança e Guards

```typescript
// Todas as rotas (exceto /auth/register e /auth/login) usam JwtAuthGuard
// Aplicado globalmente via APP_GUARD no AppModule

// O guard injeta o usuário no request:
// req.user = { id, email }

// Cada service valida que o recurso pertence ao userId logado
// Ex: prisma.transaction.findFirst({ where: { id, userId } })
// Se não encontrar: throw new NotFoundException()
```

---

## 9. Configuração Docker Compose

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: clearflow_db
    environment:
      POSTGRES_USER: clearflow
      POSTGRES_PASSWORD: clearflow_secret
      POSTGRES_DB: clearflow_finance
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clearflow"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### `.env`

```env
DATABASE_URL="postgresql://clearflow:clearflow_secret@localhost:5432/clearflow_finance"
JWT_SECRET="seu_segredo_super_secreto_aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
```

---

## 10. Configuração do NestJS (`main.ts`)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global
  app.setGlobalPrefix('api/v1');

  // Validação e transformação automática
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Filtro global de exceções → ApiResponse.error
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS para o frontend
  app.enableCors({ origin: 'http://localhost:5173' });

  await app.listen(process.env.PORT ?? 3000);
}
```

---

## 11. Ordem de Implementação (Etapas)

### Etapa 1 — Setup do projeto
- [ ] `nest new clearflow-api`
- [ ] Instalar dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `@prisma/client`, `prisma`
- [ ] Criar `docker-compose.yml` e subir o banco
- [ ] Configurar `prisma/schema.prisma` com todas as entidades
- [ ] Rodar `prisma migrate dev --name init`
- [ ] Criar `PrismaModule` e `PrismaService`

### Etapa 2 — Infraestrutura comum
- [ ] Criar `ApiResponse` class
- [ ] Criar `HttpExceptionFilter`
- [ ] Criar `JwtAuthGuard`
- [ ] Criar `CurrentUser` decorator
- [ ] Configurar `ValidationPipe` global no `main.ts`

### Etapa 3 — Auth
- [ ] `AuthModule` com register e login
- [ ] Hash de senha com bcrypt
- [ ] Geração e validação de JWT
- [ ] Endpoint `GET /auth/me`
- [ ] Ao registrar: cria `User` + `Profile` + categorias padrão em uma transação Prisma

### Etapa 4 — Profile e Categories
- [ ] `ProfileModule` (GET + PATCH)
- [ ] `CategoriesModule` (CRUD completo)
- [ ] Seed de categorias padrão na criação do usuário (Moradia, Alimentação, Transporte, Saúde, Lazer, Compras, Outros)

### Etapa 5 — Transações e Receitas
- [ ] `TransactionsModule` com filtros por mês/ano
- [ ] Lógica de criação de parcelas
- [ ] Endpoint PATCH `/transactions/:id/pay`
- [ ] `IncomesModule` com filtros por mês/ano

### Etapa 6 — Cartões e Faturas
- [ ] `CreditCardsModule`
- [ ] `InvoicesModule` com purchases aninhadas
- [ ] Recálculo automático de `totalAmount`

### Etapa 7 — Cofrinhos e Investimentos
- [ ] `PiggyBanksModule` com deposit/withdraw
- [ ] `InvestmentsModule`

### Etapa 8 — Dashboard e Reports
- [ ] `DashboardModule` com summary, categories, alerts
- [ ] `ReportsModule` com cashflow e evolução mensal

### Etapa 9 — Qualidade
- [ ] Testes unitários dos services (Jest)
- [ ] Testes e2e dos principais endpoints
- [ ] Documentação Swagger (`@nestjs/swagger`)

---

## 12. Dependências a Instalar

```bash
# Core
npm i @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt

# Validação
npm i class-validator class-transformer

# Banco
npm i @prisma/client
npm i -D prisma

# Segurança
npm i bcrypt
npm i -D @types/bcrypt @types/passport-jwt

# Swagger (opcional mas recomendado)
npm i @nestjs/swagger swagger-ui-express
```

---

## 13. Notas Finais para o Codex

- **Sempre** validar `userId` em todas as queries Prisma (nunca confiar só no JWT sem checar no banco)
- **Sempre** retornar `ApiResponse` — nunca retornar objeto puro
- Usar `Decimal` do Prisma para valores monetários, converter para `number` apenas no DTO de resposta
- Datas no banco como `DateTime @db.Date`, receber/devolver como `string` ISO (`YYYY-MM-DD`)
- Instalar e parceladas: usar `prisma.$transaction([])` para garantir atomicidade
- Não implementar multitenancy — `userId` do JWT é suficiente como escopo
- CORS configurado para `localhost:5173` (Vite dev server do frontend)
