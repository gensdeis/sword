import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GachaService } from './gacha.service';
import { PullResponseDto } from './dto/pull-response.dto';
import { RerollResponseDto } from './dto/reroll-response.dto';
import { KeepResponseDto } from './dto/keep-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gacha')
@Controller('gacha')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Post('pull')
  @ApiOperation({ summary: 'Pull a weapon from gacha (costs 1000 gold)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully pulled a weapon',
    type: PullResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (insufficient gold, active session, etc.)' })
  async pullWeapon(@Request() req): Promise<PullResponseDto> {
    return this.gachaService.pullWeapon(req.user.userId);
  }

  @Post('reroll/:sessionId')
  @ApiOperation({ summary: 'Reroll current gacha pull' })
  @ApiParam({ name: 'sessionId', description: 'Gacha session ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully rerolled the weapon',
    type: RerollResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (no session, max rerolls, insufficient gold, etc.)' })
  async rerollWeapon(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ): Promise<RerollResponseDto> {
    return this.gachaService.rerollWeapon(req.user.userId, sessionId);
  }

  @Post('keep/:sessionId')
  @ApiOperation({ summary: 'Keep current weapon and add to inventory' })
  @ApiParam({ name: 'sessionId', description: 'Gacha session ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully kept the weapon',
    type: KeepResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (no session, inventory full, etc.)' })
  async keepWeapon(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ): Promise<KeepResponseDto> {
    return this.gachaService.keepWeapon(req.user.userId, sessionId);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current gacha session info' })
  @ApiResponse({
    status: 200,
    description: 'Returns current gacha session if exists',
  })
  async getCurrentSession(@Request() req) {
    const session = await this.gachaService.getCurrentPullSession(req.user.userId);
    if (!session) {
      return null;
    }
    return this.gachaService.getGachaSessionDetails(session);
  }
}
