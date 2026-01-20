# Season Module

The Season module manages competitive seasons for the Sword Growing Game PvP system.

## Features

- **Season Management**: Create, manage, and settle competitive seasons
- **Real-time Rankings**: Redis-based real-time leaderboard tracking
- **Reward Distribution**: Automatic rank 1 reward distribution via mail
- **Settlement Period**: Automatic blocking of battles during settlement (Monday 00:00 - 07:59)
- **Streak Tracking**: Track user win streaks and best streaks

## Season Schedule

- **Start**: Monday 08:00
- **End**: Sunday 23:59
- **Settlement**: Monday 00:00 - 07:59 (no battles allowed)
- **Status Flow**: UPCOMING → ACTIVE → SETTLING → COMPLETED

## API Endpoints

### GET /seasons/current
Get current season information including status and settlement state.

**Response:**
```json
{
  "id": 1,
  "seasonNumber": 1,
  "startAt": "2026-01-13T08:00:00.000Z",
  "endAt": "2026-01-19T23:59:59.000Z",
  "status": "active",
  "rewardWeaponTemplateId": 101,
  "isInSettlement": false
}
```

### GET /seasons/:id/rankings
Get season rankings (top 100 players).

**Response:**
```json
{
  "seasonId": 1,
  "rankings": [
    {
      "rank": 1,
      "userId": 12345,
      "username": "PlayerOne",
      "totalPoints": 1250,
      "winCount": 45,
      "loseCount": 12,
      "currentStreak": 5,
      "bestStreak": 15
    }
  ],
  "totalParticipants": 100
}
```

## Service Methods

### Season Management
- `getCurrentSeason()` - Get active season
- `getSeasonStatus()` - Check if active/settling
- `createNewSeason(seasonNumber, startAt, endAt, rewardWeaponId)` - Create new season
- `settleSeason(seasonId)` - End season and distribute rewards

### Ranking & Stats
- `getRankings(seasonId, limit)` - Get top rankings from Redis
- `getUserStreak(userId, seasonId)` - Get current streak
- `incrementStreak(userId, seasonId)` - Increment on win
- `resetStreak(userId, seasonId)` - Reset on loss
- `updateUserStats(userId, seasonId, isWin)` - Update win/loss counts

### Settlement
- `isInSettlementPeriod()` - Check if Mon 00:00-07:59
- `sendRank1Reward(userId, seasonId)` - Send weapon via mail (expires next season end)

## Redis Data Structure

### Rankings (Sorted Set)
```
Key: season:{seasonId}:ranking
Score: total points
Member: userId
```

### Streaks (Hash)
```
Key: season:{seasonId}:streaks
Field: userId
Value: current streak count
```

### Stats (Hash)
```
Key: season:{seasonId}:stats
Field: userId
Value: JSON { winCount, loseCount, bestStreak }
```

## Reward System

- **Rank 1**: Receives special weapon via mail
- **Expiration**: Next season end (Sunday 23:59)
- **Delivery**: Automatic during settlement
- **Mail Title**: "Season {number} Rank 1 Reward!"

## Configuration

All season settings are defined in `game-balance.config.ts`:

```typescript
SEASON: {
  START_DAY: 1,        // Monday
  START_HOUR: 8,       // 08:00
  END_DAY: 0,          // Sunday
  END_HOUR: 23,        // 23:59
  SETTLEMENT_START: 0, // Monday 00:00
  SETTLEMENT_END: 7,   // 07:59
}
```

## Dependencies

- **TypeORM**: Database operations (Season, SeasonRanking entities)
- **RedisModule**: Real-time rankings and stats
- **MailModule**: Reward distribution

## Database Entities

### Season
- id, seasonNumber, startAt, endAt, status
- rewardWeaponTemplateId (optional)
- Relations: battleRecords, rankings

### SeasonRanking
- seasonId, userId (composite PK)
- totalPoints, winCount, loseCount
- currentStreak, bestStreak
