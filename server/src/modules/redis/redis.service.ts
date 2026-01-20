import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get('REDIS_PORT') || 6379;

    // Main client for general operations
    this.client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    // Pub/Sub clients
    this.pubClient = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    this.subClient = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    await this.client.connect();
    await this.pubClient.connect();
    await this.subClient.connect();

    console.log('✅ Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
  }

  // === General Operations ===
  getClient(): RedisClientType {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // === Hash Operations ===
  async hGet(key: string, field: string): Promise<string | undefined> {
    return await this.client.hGet(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async hIncrBy(key: string, field: string, increment: number): Promise<number> {
    return await this.client.hIncrBy(key, field, increment);
  }

  async hDel(key: string, field: string): Promise<void> {
    await this.client.hDel(key, field);
  }

  async hKeys(key: string): Promise<string[]> {
    return await this.client.hKeys(key);
  }

  async hLen(key: string): Promise<number> {
    return await this.client.hLen(key);
  }

  // === Sorted Set Operations (for rankings) ===
  async zAdd(key: string, score: number, member: string): Promise<void> {
    await this.client.zAdd(key, { score, value: member });
  }

  async zRank(key: string, member: string): Promise<number | null> {
    return await this.client.zRank(key, member);
  }

  async zRevRank(key: string, member: string): Promise<number | null> {
    return await this.client.zRevRank(key, member);
  }

  async zRevRange(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[]> {
    return await this.client.zRange(key, start, stop, { REV: true });
  }

  async zRevRangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<Array<{ value: string; score: number }>> {
    return await this.client.zRangeWithScores(key, start, stop, { REV: true });
  }

  async zScore(key: string, member: string): Promise<number | null> {
    return await this.client.zScore(key, member);
  }

  async zIncrBy(key: string, increment: number, member: string): Promise<number> {
    return await this.client.zIncrBy(key, increment, member);
  }

  // === List Operations (for queues) ===
  async lPush(key: string, value: string): Promise<void> {
    await this.client.lPush(key, value);
  }

  async rPush(key: string, value: string): Promise<void> {
    await this.client.rPush(key, value);
  }

  async lPop(key: string): Promise<string | null> {
    return await this.client.lPop(key);
  }

  async rPop(key: string): Promise<string | null> {
    return await this.client.rPop(key);
  }

  async lLen(key: string): Promise<number> {
    return await this.client.lLen(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lRange(key, start, stop);
  }

  // === Set Operations ===
  async sAdd(key: string, member: string): Promise<void> {
    await this.client.sAdd(key, member);
  }

  async sRem(key: string, member: string): Promise<void> {
    await this.client.sRem(key, member);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    return await this.client.sIsMember(key, member);
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  // === Pub/Sub Operations ===
  async publish(channel: string, message: string): Promise<void> {
    await this.pubClient.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subClient.subscribe(channel, callback);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subClient.unsubscribe(channel);
  }

  // === Prayer Pool Specific Operations ===
  async initPrayerPool(): Promise<void> {
    const poolKey = 'global:prayer:pool';
    const exists = await this.exists(poolKey);

    if (!exists) {
      await this.hSet(poolKey, 'positiveBuffs', '0');
      await this.hSet(poolKey, 'negativeBuffs', '0');
      await this.hSet(poolKey, 'neutrals', '0');
      console.log('✅ Prayer pool initialized');
    }
  }

  async getPrayerPoolStats(): Promise<{
    positiveBuffs: number;
    negativeBuffs: number;
    neutrals: number;
    total: number;
  }> {
    const poolKey = 'global:prayer:pool';
    const pool = await this.hGetAll(poolKey);

    const positiveBuffs = parseInt(pool.positiveBuffs || '0');
    const negativeBuffs = parseInt(pool.negativeBuffs || '0');
    const neutrals = parseInt(pool.neutrals || '0');

    return {
      positiveBuffs,
      negativeBuffs,
      neutrals,
      total: positiveBuffs + negativeBuffs + neutrals,
    };
  }
}
