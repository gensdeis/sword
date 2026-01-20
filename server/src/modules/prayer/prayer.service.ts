import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '@/modules/redis/redis.service';
import { PrayerHistory, PrayerResult } from '@/entities/prayer-history.entity';
import { GAME_CONFIG } from '@/config/game-balance.config';

@Injectable()
export class PrayerService implements OnModuleInit {
  constructor(
    @InjectRepository(PrayerHistory)
    private prayerHistoryRepository: Repository<PrayerHistory>,
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
    // Generate random prayer result
    const result = this.generatePrayerResult();

    // Add to global pool
    await this.addToGlobalPool(result);

    // Record in prayer history
    const prayerHistory = this.prayerHistoryRepository.create({
      userId,
      result,
      wasConsumed: false,
    });
    await this.prayerHistoryRepository.save(prayerHistory);

    // Get updated pool stats
    const stats = await this.getPrayerPoolStats();

    return {
      message: '기도를 올렸습니다...',
      globalPoolSize: stats.total,
    };
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
  async getPrayerPoolStats(): Promise<{
    positiveBuffs: number;
    negativeBuffs: number;
    neutrals: number;
    total: number;
  }> {
    return await this.redisService.getPrayerPoolStats();
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
