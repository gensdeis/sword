import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Season, SeasonStatus } from '../../entities/season.entity';
import { SeasonRanking } from '../../entities/season-ranking.entity';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { GAME_CONFIG } from '../../config/game-balance.config';

@Injectable()
export class SeasonService {
  private readonly logger = new Logger(SeasonService.name);

  constructor(
    @InjectRepository(Season)
    private seasonRepository: Repository<Season>,
    @InjectRepository(SeasonRanking)
    private rankingRepository: Repository<SeasonRanking>,
    private redisService: RedisService,
    private mailService: MailService,
  ) {}

  /**
   * Get the current active season
   */
  async getCurrentSeason(): Promise<Season | null> {
    const now = new Date();

    // Check if we're in settlement period
    if (this.isInSettlementPeriod()) {
      // During settlement, return the settling season
      return await this.seasonRepository.findOne({
        where: { status: SeasonStatus.SETTLING },
        order: { seasonNumber: 'DESC' },
      });
    }

    // Return active season
    return await this.seasonRepository.findOne({
      where: {
        status: SeasonStatus.ACTIVE,
        startAt: LessThan(now),
        endAt: MoreThan(now),
      },
      order: { seasonNumber: 'DESC' },
    });
  }

  /**
   * Get season status
   */
  async getSeasonStatus(): Promise<{
    isActive: boolean;
    isSettling: boolean;
    season: Season | null;
  }> {
    const season = await this.getCurrentSeason();
    const isSettling = this.isInSettlementPeriod();

    return {
      isActive: season?.status === SeasonStatus.ACTIVE && !isSettling,
      isSettling,
      season,
    };
  }

  /**
   * Check if currently in settlement period (Monday 00:00 - 07:59)
   */
  isInSettlementPeriod(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday
    const hour = now.getHours();

    const { SETTLEMENT_START, SETTLEMENT_END } = GAME_CONFIG.SEASON;

    return day === 1 && hour >= SETTLEMENT_START && hour <= SETTLEMENT_END;
  }

  /**
   * Create a new season
   */
  async createNewSeason(
    seasonNumber: number,
    startAt: Date,
    endAt: Date,
    rewardWeaponTemplateId?: number,
  ): Promise<Season> {
    const season = this.seasonRepository.create({
      seasonNumber,
      startAt,
      endAt,
      status: SeasonStatus.UPCOMING,
      rewardWeaponTemplateId: rewardWeaponTemplateId || null,
    });

    const savedSeason = await this.seasonRepository.save(season);
    this.logger.log(`Created new season #${seasonNumber} (ID: ${savedSeason.id})`);

    return savedSeason;
  }

  /**
   * Settle a season (end it and distribute rewards)
   */
  async settleSeason(seasonId: number): Promise<void> {
    const season = await this.seasonRepository.findOne({
      where: { id: seasonId },
    });

    if (!season) {
      throw new Error(`Season ${seasonId} not found`);
    }

    // Update season status to settling
    season.status = SeasonStatus.SETTLING;
    await this.seasonRepository.save(season);

    this.logger.log(`Settling season #${season.seasonNumber} (ID: ${seasonId})`);

    // Get rankings from Redis
    const rankings = await this.getRankings(seasonId, 100);

    // Save rankings to database
    for (const ranking of rankings) {
      const rankingRecord = this.rankingRepository.create({
        seasonId,
        totalPoints: ranking.totalPoints,
        winCount: ranking.winCount,
        loseCount: ranking.loseCount,
        currentStreak: ranking.currentStreak,
        bestStreak: ranking.bestStreak,
        maxEnhancementLevel: ranking.maxEnhancementLevel,
      });
      rankingRecord.userId = ranking.userId;
      await this.rankingRepository.save(rankingRecord);
    }

    // Send reward to rank 1 player
    if (rankings.length > 0 && season.rewardWeaponTemplateId) {
      const rank1User = rankings[0];
      await this.sendRank1Reward(rank1User.userId, seasonId);
    }

    // Mark season as completed
    season.status = SeasonStatus.COMPLETED;
    await this.seasonRepository.save(season);

    this.logger.log(`Season #${season.seasonNumber} settled successfully`);
  }

  /**
   * Send rank 1 reward to user via mail
   */
  async sendRank1Reward(userId: number, seasonId: number): Promise<void> {
    const season = await this.seasonRepository.findOne({
      where: { id: seasonId },
    });

    if (!season || !season.rewardWeaponTemplateId) {
      this.logger.warn(`No reward weapon for season ${seasonId}`);
      return;
    }

    // Calculate expiration date (next season end - Sunday 23:59)
    const expiresAt = this.mailService.getNextSeasonEndDate();

    await this.mailService.sendWeaponReward(
      userId,
      season.rewardWeaponTemplateId,
      `Season ${season.seasonNumber} Rank 1 Reward!`,
      `Congratulations! You ranked #1 in Season ${season.seasonNumber}. Here's your exclusive weapon reward!`,
      expiresAt,
    );

    this.logger.log(
      `Sent rank 1 reward to user ${userId} for season ${seasonId}`,
    );
  }

  /**
   * Get rankings from Redis (real-time)
   */
  async getRankings(
    seasonId: number,
    limit: number = 100,
    type: 'points' | 'enhancement' = 'points',
  ): Promise<
    Array<{
      userId: number;
      username: string;
      totalPoints: number;
      winCount: number;
      loseCount: number;
      currentStreak: number;
      bestStreak: number;
      maxEnhancementLevel: number;
    }>
  > {
    const pointsRankingKey = GAME_CONFIG.BATTLE.REDIS_KEYS.RANKING(seasonId);
    const enhancementRankingKey = `season:${seasonId}:enhancement_ranking`;
    const rankingKey = type === 'enhancement' ? enhancementRankingKey : pointsRankingKey;

    const streakKey = `season:${seasonId}:streaks`;
    const statsKey = `season:${seasonId}:stats`;

    // Get top rankings from sorted set
    const topUsers = await this.redisService.zRevRangeWithScores(
      rankingKey,
      0,
      limit - 1,
    );

    const rankings = [];

    for (const { value: userIdStr, score: rankingScore } of topUsers) {
      const userId = parseInt(userIdStr);

      // Get streak data
      const streakData = await this.redisService.hGet(streakKey, userIdStr);
      const currentStreak = streakData ? parseInt(streakData) : 0;

      // Get stats (win/lose counts, best streak, and max enhancement level)
      const statsData = await this.redisService.hGet(statsKey, userIdStr);
      let winCount = 0;
      let loseCount = 0;
      let bestStreak = currentStreak;
      let maxEnhancementLevel = 0;

      if (statsData) {
        const stats = JSON.parse(statsData);
        winCount = stats.winCount || 0;
        loseCount = stats.loseCount || 0;
        bestStreak = stats.bestStreak || currentStreak;
        maxEnhancementLevel = stats.maxEnhancementLevel || 0;
      }

      // If we are looking for enhancement ranking, rankingScore IS maxEnhancementLevel
      // If we are looking for points ranking, rankingScore IS totalPoints
      const totalPointsValue = type === 'points' ? rankingScore : 0; // If enhancement rank, we might not have points easily here
      
      // If we're sorting by points, we need to make sure we get maxEnhancementLevel even if it's not the score
      // If we're sorting by enhancement, we might want to get totalPoints if possible
      let totalPoints = totalPointsValue;
      if (type === 'enhancement') {
        const pointsScore = await this.redisService.zScore(pointsRankingKey, userIdStr);
        totalPoints = pointsScore || 0;
      }

      // Get username (simplified - in production, you'd query the User table)
      const username = `User${userId}`;

      rankings.push({
        userId,
        username,
        totalPoints,
        winCount,
        loseCount,
        currentStreak,
        bestStreak,
        maxEnhancementLevel,
      });
    }

    return rankings;
  }

  /**
   * Get user's current streak from Redis
   */
  async getUserStreak(userId: number, seasonId: number): Promise<number> {
    const streakKey = `season:${seasonId}:streaks`;
    const streak = await this.redisService.hGet(streakKey, userId.toString());
    return streak ? parseInt(streak) : 0;
  }

  /**
   * Increment user's streak on win
   */
  async incrementStreak(userId: number, seasonId: number): Promise<number> {
    const streakKey = `season:${seasonId}:streaks`;
    const newStreak = await this.redisService.hIncrBy(
      streakKey,
      userId.toString(),
      1,
    );

    // Update best streak if needed
    await this.updateBestStreak(userId, seasonId, newStreak);

    return newStreak;
  }

  /**
   * Reset user's streak on loss
   */
  async resetStreak(userId: number, seasonId: number): Promise<void> {
    const streakKey = `season:${seasonId}:streaks`;
    await this.redisService.hSet(streakKey, userId.toString(), '0');
  }

  /**
   * Update best streak if current streak is higher
   */
  private async updateBestStreak(
    userId: number,
    seasonId: number,
    currentStreak: number,
  ): Promise<void> {
    const statsKey = `season:${seasonId}:stats`;
    const statsData = await this.redisService.hGet(statsKey, userId.toString());

    let stats = {
      winCount: 0,
      loseCount: 0,
      bestStreak: 0,
      maxEnhancementLevel: 0,
    };

    if (statsData) {
      stats = JSON.parse(statsData);
    }

    if (currentStreak > stats.bestStreak) {
      stats.bestStreak = currentStreak;
      await this.redisService.hSet(
        statsKey,
        userId.toString(),
        JSON.stringify(stats),
      );
    }
  }

  /**
   * Update user stats (win/lose counts)
   */
  async updateUserStats(
    userId: number,
    seasonId: number,
    isWin: boolean,
  ): Promise<void> {
    const statsKey = `season:${seasonId}:stats`;
    const statsData = await this.redisService.hGet(statsKey, userId.toString());

    let stats = {
      winCount: 0,
      loseCount: 0,
      bestStreak: 0,
      maxEnhancementLevel: 0,
    };

    if (statsData) {
      stats = JSON.parse(statsData);
    }

    if (isWin) {
      stats.winCount += 1;
    } else {
      stats.loseCount += 1;
    }

    await this.redisService.hSet(
      statsKey,
      userId.toString(),
      JSON.stringify(stats),
    );
  }

  /**
   * Update maximum enhancement level achieved in the current season
   */
  async updateMaxEnhancementLevel(
    userId: number,
    seasonId: number,
    level: number,
  ): Promise<void> {
    const statsKey = `season:${seasonId}:stats`;
    const enhancementRankingKey = `season:${seasonId}:enhancement_ranking`;
    
    const statsData = await this.redisService.hGet(statsKey, userId.toString());

    let stats = {
      winCount: 0,
      loseCount: 0,
      bestStreak: 0,
      maxEnhancementLevel: 0,
    };

    if (statsData) {
      stats = JSON.parse(statsData);
    }

    if (level > stats.maxEnhancementLevel) {
      stats.maxEnhancementLevel = level;
      
      // Update stats in Redis
      await this.redisService.hSet(
        statsKey,
        userId.toString(),
        JSON.stringify(stats),
      );

      // Update enhancement ranking in Redis
      await this.redisService.zAdd(enhancementRankingKey, level, userId.toString());
      
      this.logger.log(`User ${userId} reached new max enhancement level ${level} in season ${seasonId}`);
    }
  }
}
