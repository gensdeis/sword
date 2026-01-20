# Prayer Module

## Overview
The Prayer Module implements the global prayer pool system where users can contribute prayers that affect weapon enhancement outcomes.

## Features

### Prayer Pool System
- Global shared pool stored in Redis
- Three types of prayer results:
  - **Positive** (30% chance): +5%p success rate when consumed
  - **Negative** (30% chance): +3%p destruction rate when consumed
  - **Neutral** (40% chance): No effect when consumed

### Pool Limits
- Maximum 50 positive buffs
- Maximum 50 negative buffs
- Maximum 100 neutral effects

### User Experience
- Users don't see the actual result of their prayer
- Simple message: "기도를 올렸습니다..." (Prayer has been offered)
- Shows current global pool size

## API Endpoints

### POST /prayer/pray
Perform a prayer action.

**Response:**
```json
{
  "message": "기도를 올렸습니다...",
  "globalPoolSize": 42
}
```

### GET /prayer/pool
Get prayer pool statistics (admin/debug endpoint).

**Response:**
```json
{
  "positiveBuffs": 15,
  "negativeBuffs": 12,
  "neutrals": 20,
  "total": 47
}
```

## Implementation Details

### Redis Storage
- Key: `global:prayer:pool`
- Hash fields:
  - `positiveBuffs`: Count of positive buffs
  - `negativeBuffs`: Count of negative buffs
  - `neutrals`: Count of neutral effects

### Database Records
All prayers are recorded in the `prayer_history` table:
- `userId`: Who prayed
- `result`: What type was generated
- `wasConsumed`: Whether it was used in enhancement
- `prayedAt`: Timestamp of prayer
- `consumedAt`: Timestamp when consumed (if applicable)

## Usage Example

```typescript
// In your service
constructor(private prayerService: PrayerService) {}

// User performs prayer
const result = await this.prayerService.pray(userId);

// Consume effect during enhancement
const effect = await this.prayerService.consumePrayerEffect();
// Returns: 'positive' | 'negative' | 'neutral' | 'none'
```

## Configuration
All prayer-related configuration is in `config/game-balance.config.ts`:
- `PRAYER.GENERATION_RATES`: Probability of each result type
- `PRAYER.EFFECTS`: Modifier values for enhancement
- `PRAYER.POOL_LIMITS`: Maximum counts for each type
- `PRAYER.REDIS_KEYS`: Redis key names
