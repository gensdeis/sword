import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { BattleRecord } from '../../entities/battle-record.entity';
import { User } from '../../entities/user.entity';
import { UserWeapon } from '../../entities/user-weapon.entity';
import { WeaponsService } from '../weapons/weapons.service';
import { SeasonService } from '../season/season.service';
import { RedisService } from '../redis/redis.service';
import {
  GAME_CONFIG,
  calculateWinRate,
  calculateBattleRewards,
} from '../../config/game-balance.config';

@Injectable()
export class BattleService {
  private readonly logger = new Logger(BattleService.name);

  constructor(
    @InjectRepository(BattleRecord)
    private battleRecordRepository: Repository<BattleRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private weaponsService: WeaponsService,
    private seasonService: SeasonService,
    private redisService: RedisService,
  ) {}

  /**
   * Enter battle - pay entry fee and find opponent
   */
  async enterBattle(userId: number): Promise<{
    matchId: string;
    opponent: {
      userId: number;
      username: string;
      weaponLevel: number;
      weaponName: string;
      weaponRarity: string;
    };
    winRate: number;
    myWeaponLevel: number;
  }> {
    // Check if in settlement period
    const { isActive, isSettling } = await this.seasonService.getSeasonStatus();

    if (isSettling || !isActive) {
      throw new BadRequestException(
        'Battles are not available during settlement period (Monday 00:00 - 07:59)',
      );
    }

    // Check if already in battle
    const inMatchKey = GAME_CONFIG.BATTLE.REDIS_KEYS.IN_MATCH;
    const isInMatch = await this.redisService.sIsMember(
      inMatchKey,
      userId.toString(),
    );

    if (isInMatch) {
      throw new BadRequestException('You are already in a battle');
    }

    // Get user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check gold for entry fee
    const entryFee = GAME_CONFIG.BATTLE.ENTRY_FEE;
    if (user.gold < entryFee) {
      throw new BadRequestException(
        `Insufficient gold. Entry fee is ${entryFee} gold.`,
      );
    }

    // Get user's battle weapon
    const myWeapon = await this.weaponsService.getEquippedWeapon(userId);

    // Find opponent
    const opponent = await this.findOpponent(myWeapon.enhancementLevel, userId);

    // Deduct entry fee
    user.gold -= entryFee;
    await this.userRepository.save(user);

    // Calculate win rate
    const winRate = calculateWinRate(
      myWeapon.enhancementLevel,
      opponent.weapon.enhancementLevel,
    );

    // Generate match ID
    const matchId = `match_${userId}_${Date.now()}`;

    // Mark user as in match
    await this.redisService.sAdd(inMatchKey, userId.toString());

    // Store match data in Redis with 5 minute expiry
    await this.redisService.set(
      `battle:match:${matchId}`,
      JSON.stringify({
        userId,
        opponentId: opponent.userId,
        myWeaponId: myWeapon.id,
        opponentWeaponId: opponent.weapon.id,
        myLevel: myWeapon.enhancementLevel,
        opponentLevel: opponent.weapon.enhancementLevel,
        winRate,
      }),
      300, // 5 minutes
    );

    this.logger.log(
      `User ${userId} (Lv.${myWeapon.enhancementLevel}) matched with User ${opponent.userId} (Lv.${opponent.weapon.enhancementLevel}), Win Rate: ${winRate}%`,
    );

    return {
      matchId,
      opponent: {
        userId: opponent.userId,
        username: opponent.username,
        weaponLevel: opponent.weapon.enhancementLevel,
        weaponName: opponent.weapon.weaponTemplate.name,
        weaponRarity: opponent.weapon.weaponTemplate.rarity,
      },
      winRate,
      myWeaponLevel: myWeapon.enhancementLevel,
    };
  }

  /**
   * Find opponent with similar level (±3 levels)
   */
  async findOpponent(
    myLevel: number,
    myUserId: number,
  ): Promise<{
    userId: number;
    username: string;
    weapon: UserWeapon;
  }> {
    const levelRange = GAME_CONFIG.BATTLE.MATCHING_LEVEL_RANGE;
    const minLevel = Math.max(0, myLevel - levelRange);
    const maxLevel = myLevel + levelRange;

    // Get potential opponents with weapons in level range
    const potentialOpponents = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.weapons', 'weapon')
      .innerJoinAndSelect('weapon.weaponTemplate', 'template')
      .where('user.id != :myUserId', { myUserId })
      .andWhere('weapon.isDestroyed = false')
      .andWhere('weapon.enhancementLevel BETWEEN :minLevel AND :maxLevel', {
        minLevel,
        maxLevel,
      })
      .getMany();

    if (potentialOpponents.length === 0) {
      throw new BadRequestException('No opponents available at your level range');
    }

    // Select random opponent with weighted probability (closer levels = higher weight)
    const opponent = this.selectWeightedOpponent(potentialOpponents, myLevel);

    // Get opponent's battle weapon
    const opponentWeapon = await this.weaponsService.getEquippedWeapon(
      opponent.id,
    );

    return {
      userId: opponent.id,
      username: opponent.username,
      weapon: opponentWeapon,
    };
  }

  /**
   * Select opponent with weighted random (closer levels = higher probability)
   */
  private selectWeightedOpponent(opponents: User[], myLevel: number): User {
    // Calculate weights (closer level = higher weight)
    const weights = opponents.map((opp) => {
      const weapon = opp.weapons.find((w) => !w.isDestroyed);
      if (!weapon) return 0;

      const levelDiff = Math.abs(weapon.enhancementLevel - myLevel);
      return Math.max(1, 4 - levelDiff); // Weight: 4, 3, 2, 1 for diff 0, 1, 2, 3+
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < opponents.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return opponents[i];
      }
    }

    return opponents[opponents.length - 1];
  }

  /**
   * Execute battle and determine result
   */
  async executeBattle(
    userId: number,
    matchId: string,
  ): Promise<{
    isWin: boolean;
    pointsEarned: number;
    goldEarned: number;
    currentStreak: number;
    totalPoints: number;
    winRate: number;
    opponentName: string;
    opponentLevel: number;
  }> {
    // Get match data
    const matchData = await this.redisService.get(`battle:match:${matchId}`);

    if (!matchData) {
      throw new BadRequestException('Match not found or expired');
    }

    const match = JSON.parse(matchData);

    if (match.userId !== userId) {
      throw new BadRequestException('This is not your match');
    }

    // Get current season
    const season = await this.seasonService.getCurrentSeason();
    if (!season) {
      throw new BadRequestException('No active season');
    }

    // Get current streak before battle
    const currentStreak = await this.seasonService.getUserStreak(
      userId,
      season.id,
    );

    // Determine battle result
    const isWin = this.determineBattleResult(match.winRate);

    // Calculate rewards
    const rewards = calculateBattleRewards(isWin, isWin ? currentStreak + 1 : 0);

    // Distribute rewards
    await this.distributeBattleRewards(
      isWin ? userId : match.opponentId,
      isWin ? match.opponentId : userId,
      isWin ? currentStreak + 1 : 0,
    );

    // Update rankings
    await this.updateRankings(
      season.id,
      isWin ? userId : match.opponentId,
      isWin ? match.opponentId : userId,
      rewards.points,
    );

    // Update streaks
    if (isWin) {
      await this.seasonService.incrementStreak(userId, season.id);
      await this.seasonService.resetStreak(match.opponentId, season.id);
    } else {
      await this.seasonService.resetStreak(userId, season.id);
      await this.seasonService.incrementStreak(match.opponentId, season.id);
    }

    // Update user stats
    await this.seasonService.updateUserStats(userId, season.id, isWin);
    await this.seasonService.updateUserStats(match.opponentId, season.id, !isWin);

    // Save battle record
    await this.saveBattleRecord({
      seasonId: season.id,
      winnerId: isWin ? userId : match.opponentId,
      loserId: isWin ? match.opponentId : userId,
      winnerWeaponId: isWin ? match.myWeaponId : match.opponentWeaponId,
      loserWeaponId: isWin ? match.opponentWeaponId : match.myWeaponId,
      winnerWeaponLevel: isWin ? match.myLevel : match.opponentLevel,
      loserWeaponLevel: isWin ? match.opponentLevel : match.myLevel,
      winRate: isWin ? match.winRate : 100 - match.winRate,
      winnerPointsEarned: rewards.points,
      winnerGoldEarned: rewards.gold,
      loserGoldEarned: rewards.loserGold || 0,
      winnerStreak: isWin ? currentStreak + 1 : 1,
    });

    // Remove from in-match set
    await this.redisService.sRem(
      GAME_CONFIG.BATTLE.REDIS_KEYS.IN_MATCH,
      userId.toString(),
    );

    // Delete match data
    await this.redisService.del(`battle:match:${matchId}`);

    // Get updated total points
    const rankingKey = GAME_CONFIG.BATTLE.REDIS_KEYS.RANKING(season.id);
    const totalPoints =
      (await this.redisService.zScore(rankingKey, userId.toString())) || 0;

    // Get opponent info
    const opponent = await this.userRepository.findOne({
      where: { id: match.opponentId },
    });

    this.logger.log(
      `Battle completed: User ${userId} ${isWin ? 'WON' : 'LOST'} against User ${match.opponentId}`,
    );

    return {
      isWin,
      pointsEarned: rewards.points,
      goldEarned: rewards.gold,
      currentStreak: isWin ? currentStreak + 1 : 0,
      totalPoints,
      winRate: match.winRate,
      opponentName: opponent?.username || 'Unknown',
      opponentLevel: match.opponentLevel,
    };
  }

  /**
   * Determine battle result based on win rate
   */
  determineBattleResult(winRate: number): boolean {
    const random = Math.random() * 100;
    return random < winRate;
  }

  /**
   * Distribute battle rewards (gold) to winner and loser
   */
  async distributeBattleRewards(
    winnerId: number,
    loserId: number,
    winnerStreak: number,
  ): Promise<void> {
    const rewards = calculateBattleRewards(true, winnerStreak);

    // Give gold to winner
    await this.userRepository.increment({ id: winnerId }, 'gold', rewards.gold);

    // Give consolation gold to loser
    await this.userRepository.increment(
      { id: loserId },
      'gold',
      rewards.loserGold || 0,
    );
  }

  /**
   * Update season rankings in Redis
   */
  async updateRankings(
    seasonId: number,
    winnerId: number,
    loserId: number,
    points: number,
  ): Promise<void> {
    const rankingKey = GAME_CONFIG.BATTLE.REDIS_KEYS.RANKING(seasonId);

    // Add points to winner
    await this.redisService.zIncrBy(rankingKey, points, winnerId.toString());

    // Ensure loser exists in ranking (with 0 points if new)
    const loserScore = await this.redisService.zScore(
      rankingKey,
      loserId.toString(),
    );
    if (loserScore === null) {
      await this.redisService.zAdd(rankingKey, 0, loserId.toString());
    }
  }

  /**
   * Save battle record to database
   */
  async saveBattleRecord(battleData: {
    seasonId: number;
    winnerId: number;
    loserId: number;
    winnerWeaponId: number;
    loserWeaponId: number;
    winnerWeaponLevel: number;
    loserWeaponLevel: number;
    winRate: number;
    winnerPointsEarned: number;
    winnerGoldEarned: number;
    loserGoldEarned: number;
    winnerStreak: number;
  }): Promise<BattleRecord> {
    const record = this.battleRecordRepository.create({
      seasonId: battleData.seasonId,
      winnerWeaponId: battleData.winnerWeaponId,
      loserWeaponId: battleData.loserWeaponId,
      winnerWeaponLevel: battleData.winnerWeaponLevel,
      loserWeaponLevel: battleData.loserWeaponLevel,
      winRate: battleData.winRate,
      winnerPointsEarned: battleData.winnerPointsEarned,
      winnerGoldEarned: battleData.winnerGoldEarned,
      loserGoldEarned: battleData.loserGoldEarned,
      winnerStreak: battleData.winnerStreak,
    });
    record.winnerId = battleData.winnerId;
    record.loserId = battleData.loserId;

    return await this.battleRecordRepository.save(record);
  }

  /**
   * Get user's battle history
   */
  async getBattleHistory(
    userId: number,
    limit: number = 20,
  ): Promise<{
    battles: Array<{
      id: number;
      isWin: boolean;
      opponentName: string;
      myWeaponLevel: number;
      opponentWeaponLevel: number;
      winRate: number;
      pointsEarned: number;
      goldEarned: number;
      streak: number;
      battleAt: Date;
    }>;
    total: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
  }> {
    // Get battle records where user was involved
    const [wonBattles, lostBattles] = await Promise.all([
      this.battleRecordRepository.find({
        where: { winnerId: userId },
        relations: ['loser', 'winnerWeapon', 'loserWeapon'],
        order: { battleAt: 'DESC' },
        take: limit,
      }),
      this.battleRecordRepository.find({
        where: { loserId: userId },
        relations: ['winner', 'winnerWeapon', 'loserWeapon'],
        order: { battleAt: 'DESC' },
        take: limit,
      }),
    ]);

    // Combine and sort
    const allBattles = [...wonBattles, ...lostBattles]
      .sort((a, b) => b.battleAt.getTime() - a.battleAt.getTime())
      .slice(0, limit);

    const battles = allBattles.map((battle) => {
      const isWin = battle.winnerId === userId;
      return {
        id: battle.id,
        isWin,
        opponentName: isWin ? battle.loser?.username || 'Unknown' : battle.winner?.username || 'Unknown',
        myWeaponLevel: isWin
          ? battle.winnerWeaponLevel
          : battle.loserWeaponLevel,
        opponentWeaponLevel: isWin
          ? battle.loserWeaponLevel
          : battle.winnerWeaponLevel,
        winRate: battle.winRate,
        pointsEarned: isWin ? battle.winnerPointsEarned : 0,
        goldEarned: isWin ? battle.winnerGoldEarned : battle.loserGoldEarned,
        streak: isWin ? battle.winnerStreak : 0,
        battleAt: battle.battleAt,
      };
    });

    // Get totals
    const [totalWins, totalLosses] = await Promise.all([
      this.battleRecordRepository.count({ where: { winnerId: userId } }),
      this.battleRecordRepository.count({ where: { loserId: userId } }),
    ]);

    const total = totalWins + totalLosses;
    const winRatePercent = total > 0 ? (totalWins / total) * 100 : 0;

    return {
      battles,
      total,
      totalWins,
      totalLosses,
      winRate: Math.round(winRatePercent * 100) / 100,
    };
  }

  /**
   * Get current season rankings
   */
  async getCurrentRankings(limit: number = 100) {
    const season = await this.seasonService.getCurrentSeason();

    if (!season) {
      throw new BadRequestException('No active season');
    }

    return await this.seasonService.getRankings(season.id, limit);
  }
}
