import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "src/common/decorators/public.decorator";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import type { CurrentUserPayload } from "src/common/types/current-user.type";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.me(user.id);
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
  }
}