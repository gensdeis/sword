import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BattleEnterResponseDto } from './dto/battle-enter-response.dto';
import { BattleResultResponseDto } from './dto/battle-result-response.dto';
import {
  BattleHistoryResponseDto,
  BattleRecordDto,
} from './dto/battle-history-response.dto';
import { RankingResponseDto, UserRankingDto } from '../season/dto/ranking-response.dto';

@ApiTags('Battle')
@Controller('battle')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Post('enter')
  @ApiOperation({ summary: 'Enter battle and get matched with opponent' })
  @ApiResponse({
    status: 201,
    description: 'Successfully matched with opponent',
    type: BattleEnterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient gold, already in battle, or settlement period',
  })
  @ApiResponse({ status: 404, description: 'User has no weapons or no opponents found' })
  async enterBattle(@Request() req): Promise<BattleEnterResponseDto> {
    const userId = req.user.userId;
    const result = await this.battleService.enterBattle(userId);

    // Get user to fetch remaining gold
    const user = await this.battleService['userRepository'].findOne({
      where: { id: userId },
    });

    return {
      matchId: result.matchId,
      opponent: {
        ...result.opponent,
        winRate: result.winRate,
      },
      entryFeePaid: 100,
      remainingGold: user.gold,
    };
  }

  @Post(':matchId/execute')
  @ApiOperation({ summary: 'Execute battle (auto-executes)' })
  @ApiParam({ name: 'matchId', description: 'Match ID from enter battle', example: 'match_abc123' })
  @ApiResponse({
    status: 200,
    description: 'Battle executed successfully',
    type: BattleResultResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid match or match expired' })
  async executeBattle(
    @Request() req,
    @Param('matchId') matchId: string,
  ): Promise<BattleResultResponseDto> {
    const userId = req.user.userId;
    const result = await this.battleService.executeBattle(userId, matchId);

    // Get user ranking
    const rankings = await this.battleService.getCurrentRankings(100);
    const userRank =
      rankings.findIndex((r) => r.userId === userId) + 1 || rankings.length + 1;

    // Get user to fetch total gold
    const user = await this.battleService['userRepository'].findOne({
      where: { id: userId },
    });

    return {
      isWin: result.isWin,
      pointsEarned: result.pointsEarned,
      goldEarned: result.goldEarned,
      totalGold: user.gold,
      currentStreak: result.currentStreak,
      ranking: userRank,
      totalPoints: result.totalPoints,
      winRate: result.winRate,
      opponentName: result.opponentName,
      opponentLevel: result.opponentLevel,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my battle history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of battles to retrieve (default 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Battle history retrieved successfully',
    type: BattleHistoryResponseDto,
  })
  async getBattleHistory(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<BattleHistoryResponseDto> {
    const userId = req.user.userId;
    const result = await this.battleService.getBattleHistory(userId, limit || 20);

    const battles: BattleRecordDto[] = result.battles.map((battle) => ({
      id: battle.id,
      isWin: battle.isWin,
      opponentName: battle.opponentName,
      myWeaponLevel: battle.myWeaponLevel,
      opponentWeaponLevel: battle.opponentWeaponLevel,
      winRate: battle.winRate,
      pointsEarned: battle.pointsEarned,
      goldEarned: battle.goldEarned,
      streak: battle.streak,
      battleAt: battle.battleAt,
    }));

    return {
      battles,
      total: result.total,
      totalWins: result.totalWins,
      totalLosses: result.totalLosses,
      winRate: result.winRate,
    };
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get current season rankings' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top players to retrieve (default 100)',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Current season rankings retrieved successfully',
    type: RankingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No active season' })
  async getCurrentRankings(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<RankingResponseDto> {
    const rankings = await this.battleService.getCurrentRankings(limit || 100);
    const season = await this.battleService['seasonService'].getCurrentSeason();

    if (!season) {
      throw new Error('No active season');
    }

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
      seasonId: season.id,
      rankings: userRankings,
      totalParticipants: rankings.length,
    };
  }
}
