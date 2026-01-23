import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeasonService } from './season.service';
import { SeasonResponseDto } from './dto/season-response.dto';
import { RankingResponseDto, UserRankingDto } from './dto/ranking-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Season')
@Controller('seasons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current season information' })
  @ApiResponse({
    status: 200,
    description: 'Current season info retrieved successfully',
    type: SeasonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No active season found' })
  async getCurrentSeason(): Promise<SeasonResponseDto> {
    const season = await this.seasonService.getCurrentSeason();

    if (!season) {
      return null;
    }

    return {
      id: season.id,
      seasonNumber: season.seasonNumber,
      startAt: season.startAt,
      endAt: season.endAt,
      status: season.status,
      rewardWeaponTemplateId: season.rewardWeaponTemplateId,
      isInSettlement: this.seasonService.isInSettlementPeriod(),
    };
  }

  @Get(':id/rankings')
  @ApiOperation({ summary: 'Get season rankings' })
  @ApiResponse({
    status: 200,
    description: 'Season rankings retrieved successfully',
    type: RankingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Season not found' })
  async getSeasonRankings(
    @Param('id', ParseIntPipe) seasonId: number,
    @Query('type') type: 'points' | 'enhancement' = 'points',
  ): Promise<RankingResponseDto> {
    const rankings = await this.seasonService.getRankings(seasonId, 100, type);

    const userRankings: UserRankingDto[] = rankings.map((ranking, index) => ({
      rank: index + 1,
      userId: ranking.userId,
      username: ranking.username,
      totalPoints: ranking.totalPoints,
      winCount: ranking.winCount,
      loseCount: ranking.loseCount,
      currentStreak: ranking.currentStreak,
      bestStreak: ranking.bestStreak,
      maxEnhancementLevel: ranking.maxEnhancementLevel,
    }));

    return {
      seasonId,
      rankings: userRankings,
      totalParticipants: rankings.length,
    };
  }
}
