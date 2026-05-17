import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "src/common/decorators/public.decorator";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

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

  @Post('logout')
  logout() {
    return this.authService.logout();
  }
}