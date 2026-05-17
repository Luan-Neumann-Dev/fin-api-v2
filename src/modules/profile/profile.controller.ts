import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/common/types/current-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findMe(@CurrentUser() user: CurrentUserPayload) {
    return this.profileService.findMe(user.id);
  }

  @Patch()
  updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateMe(user.id, dto);
  }
}