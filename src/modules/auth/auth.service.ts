import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from "src/prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt';
import { ApiResponse } from "src/common/response/api-response";
import { LoginDto } from "./dto/login.dto";

const DEFAULT_CATEGORIES = [
  { name: 'Moradia', color: '#22c55e' },
  { name: 'Alimentação', color: '#f97316' },
  { name: 'Transporte', color: '#06b6d4' },
  { name: 'Saúde', color: '#ef4444' },
  { name: 'Lazer', color: '#8b5cf6' },
  { name: 'Compras', color: '#ec4899' },
  { name: 'Outros', color: '#64748b' },
]

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const {email, password, displayName} = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: {email}
    })

    if(existingUser) {
      throw new ConflictException('Email já cadastrado')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await this.prisma.$transaction(async(tx) => {
      return await tx.user.create({
        data: {
          email, 
          passwordHash, 
          displayName,
          profile: {
            create: { },
          },
          categories: {
            create: DEFAULT_CATEGORIES
          },
        }
      });
    })

    return ApiResponse.created(
      {
        user: this.sanitizeUser(user),
        accessToken: await this.signToken(user.id, user.email),
      },
      'User registered'
    );
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return ApiResponse.ok(
      {
        user: this.sanitizeUser(user),
        accessToken: await this.signToken(user.id, user.email)
      },
      'Login successful',
    )
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId},
      include: { profile: true},
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return ApiResponse.ok(this.sanitizeUser(user), 'User retrieved');
  }

  logout() {
    return ApiResponse.ok(null, 'Logout successful');
  }

  private async signToken(userId: string, email: string) {
    const expiresIn = (
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d'
    ) as JwtSignOptions['expiresIn'];

    return this.jwtService.signAsync(
      { email },
      {
        subject: userId,
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn
      },
    );
  }
  
  private sanitizeUser<T extends {passwordHash: string}>(user: T) {
    const {passwordHash, ...safeUser} = user;
    return safeUser;
  }
}