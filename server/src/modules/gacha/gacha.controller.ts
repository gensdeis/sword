import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { GachaService } from './gacha.service';
import { PullResponseDto } from './dto/pull-response.dto';
import { RerollResponseDto } from './dto/reroll-response.dto';
import { KeepResponseDto } from './dto/keep-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SessionIdDto {
  sessionId: string;
}

@ApiTags('gacha')
@Controller('gacha')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
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
    return this.gachaService.pullWeapon(req.user.id);
  }

  @Post('reroll')
  @ApiOperation({ summary: 'Reroll current gacha pull' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Gacha session ID' },
      },
      required: ['sessionId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully rerolled the weapon',
    type: RerollResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (no session, max rerolls, insufficient gold, etc.)' })
  async rerollWeapon(
    @Body() body: SessionIdDto,
    @Request() req,
  ): Promise<RerollResponseDto> {
    return this.gachaService.rerollWeapon(req.user.id, body.sessionId);
  }

  @Post('keep')
  @ApiOperation({ summary: 'Keep current weapon and add to inventory' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Gacha session ID' },
      },
      required: ['sessionId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully kept the weapon',
    type: KeepResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (no session, inventory full, etc.)' })
  async keepWeapon(
    @Body() body: SessionIdDto,
    @Request() req,
  ): Promise<KeepResponseDto> {
    return this.gachaService.keepWeapon(req.user.id, body.sessionId);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current gacha session info' })
  @ApiResponse({
    status: 200,
    description: 'Returns current gacha session if exists',
  })
  async getCurrentSession(@Request() req) {
    const session = await this.gachaService.getCurrentPullSession(req.user.id);

    if (!session) {
      return {
        hasActiveSession: false,
        session: null,
      };
    }

    return {
      hasActiveSession: true,
      session: {
        sessionId: session.sessionId,
        weaponTemplateId: session.weaponTemplateId,
        rerollCount: session.rerollCount,
        totalGoldSpent: session.totalGoldSpent,
        rerollCost: this.gachaService.calculateRerollCost(session.rerollCount),
        canReroll: this.gachaService.calculateRerollCost(session.rerollCount) !== null,
      },
    };
  }
}
