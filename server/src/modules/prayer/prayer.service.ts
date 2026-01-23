import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { RedisService } from '@/modules/redis/redis.service';
import { PrayerHistory, PrayerResult } from '@/entities/prayer-history.entity';
import { User } from '@/entities/user.entity';
import { GAME_CONFIG } from '@/config/game-balance.config';

@Injectable()
export class PrayerService implements OnModuleInit {
  constructor(
    @InjectRepository(PrayerHistory)
    private prayerHistoryRepository: Repository<PrayerHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.initializePrayerPool();
  }

  /**
   * User performs a prayer action
   * Generates random result and adds to global pool
   */
  async pray(userId: number): Promise<{ message: string; globalPoolSize: number }> {
    // Get user for gold check and prayer count
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate prayer cost: (today's prayer count + 1) * 500
    // We need to count how many times the user prayed today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const prayerCountToday = await this.prayerHistoryRepository.count({
      where: {
        userId,
        prayedAt: MoreThanOrEqual(startOfDay),
      },
    });

    const prayerCost = (prayerCountToday + 1) * 500;

    if (user.gold < prayerCost) {
      throw new Error(`골드가 부족합니다. (필요 골드: ${prayerCost})`);
    }

    // Deduct gold
    user.gold -= prayerCost;
    await this.userRepository.save(user);

    // Generate random prayer result
    const result = this.generatePrayerResult();

    // Add to global pool
    await this.addToGlobalPool(result);

    // Record in prayer history
    const prayerHistory = this.prayerHistoryRepository.create({
      result,
      wasConsumed: false,
    });
    prayerHistory.userId = userId;
    await this.prayerHistoryRepository.save(prayerHistory);

    // Get updated pool stats
    const stats = await this.getPrayerPoolStats();

    return {
      message: `기도를 올렸습니다... (${prayerCost} 골드 소모)`,
      globalPoolSize: stats.total,
    };
  }

  /**
   * Reset global prayer pool
   */
  async resetPrayerPool(): Promise<void> {
    await this.redisService.resetPrayerPool();
  }

  /**
   * Consume a random prayer effect from the global pool
   * Returns the effect type or 'none' if pool is empty
   */
  async consumePrayerEffect(): Promise<'positive' | 'negative' | 'neutral' | 'none'> {
    const effect = await this.popFromGlobalPool();
    return effect || 'none';
  }

  /**
   * Get current prayer pool statistics
   */
  async getPrayerPoolStats(userId?: number): Promise<{
    positiveBuffs: number;
    negativeBuffs: number;
    neutrals: number;
    total: number;
    myTodayPrayerCount?: number;
  }> {
    const stats = await this.redisService.getPrayerPoolStats();
    let myTodayPrayerCount = undefined;

    if (userId) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      myTodayPrayerCount = await this.prayerHistoryRepository.count({
        where: {
          userId,
          prayedAt: MoreThanOrEqual(startOfDay),
        },
      });
    }

    return {
      ...stats,
      myTodayPrayerCount,
    };
  }

  /**
   * Initialize prayer pool on startup
   */
  async initializePrayerPool(): Promise<void> {
    await this.redisService.initPrayerPool();
  }

  /**
   * Generate random prayer result based on configured rates
   * 30% positive, 30% negative, 40% neutral
   */
  private generatePrayerResult(): PrayerResult {
    const rand = Math.random() * 100;
    const rates = GAME_CONFIG.PRAYER.GENERATION_RATES;

    if (rand < rates.POSITIVE) {
      return PrayerResult.POSITIVE;
    } else if (rand < rates.POSITIVE + rates.NEGATIVE) {
      return PrayerResult.NEGATIVE;
    } else {
      return PrayerResult.NEUTRAL;
    }
  }

  /**
   * Add prayer result to global pool in Redis
   * Respects max limits for each type
   */
  private async addToGlobalPool(result: PrayerResult): Promise<void> {
    const poolKey = GAME_CONFIG.PRAYER.REDIS_KEYS.POOL;
    const limits = GAME_CONFIG.PRAYER.POOL_LIMITS;

    let field: string;
    let maxLimit: number;

    switch (result) {
      case PrayerResult.POSITIVE:
        field = GAME_CONFIG.PRAYER.REDIS_KEYS.POSITIVE;
        maxLimit = limits.MAX_POSITIVE;
        break;
      case PrayerResult.NEGATIVE:
        field = GAME_CONFIG.PRAYER.REDIS_KEYS.NEGATIVE;
        maxLimit = limits.MAX_NEGATIVE;
        break;
      case PrayerResult.NEUTRAL:
        field = GAME_CONFIG.PRAYER.REDIS_KEYS.NEUTRAL;
        maxLimit = limits.MAX_NEUTRAL;
        break;
    }

    // Get current count
    const currentValue = await this.redisService.hGet(poolKey, field);
    const currentCount = parseInt(currentValue || '0');

    // Only increment if below limit
    if (currentCount < maxLimit) {
      await this.redisService.hIncrBy(poolKey, field, 1);
    }
  }

  /**
   * Pop a random effect from global pool
   * Returns the effect type or null if pool is empty
   */
  private async popFromGlobalPool(): Promise<'positive' | 'negative' | 'neutral' | null> {
    const poolKey = GAME_CONFIG.PRAYER.REDIS_KEYS.POOL;
    const stats = await this.getPrayerPoolStats();

    if (stats.total === 0) {
      return null;
    }

    // Build weighted array of available effects
    const effects: ('positive' | 'negative' | 'neutral')[] = [];

    for (let i = 0; i < stats.positiveBuffs; i++) {
      effects.push('positive');
    }
    for (let i = 0; i < stats.negativeBuffs; i++) {
      effects.push('negative');
    }
    for (let i = 0; i < stats.neutrals; i++) {
      effects.push('neutral');
    }

    // Pick random effect
    const randomIndex = Math.floor(Math.random() * effects.length);
    const selectedEffect = effects[randomIndex];

    // Decrement the selected effect
    let field: string;
    switch (selectedEffect) {
      case 'positive':
        field = GAME_CONFIG.PRAYER.REDIS_KEYS.POSITIVE;
        break;
      case 'negative':
        field = GAME_CONFIG.PRAYER.REDIS_KEYS.NEGATIVE;
        break;
      case 'neutral':
        field = GAME_CONFIG.PRAYER.REDIS_KEYS.NEUTRAL;
        break;
    }

    await this.redisService.hIncrBy(poolKey, field, -1);

    return selectedEffect;
  }
}
