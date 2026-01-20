# Battle & Season System Architecture

## System Overview

The Battle and Season modules provide a complete competitive PvP system with real-time rankings, streak tracking, and seasonal rewards for the Sword Growing Game.

## Module Architecture

### Season Module
- **Purpose**: Manage competitive seasons, rankings, and rewards
- **Key Features**: Season lifecycle, Redis rankings, streak tracking, reward distribution
- **API**: 2 endpoints (current season, rankings)

### Battle Module
- **Purpose**: Async PvP battle system with matchmaking
- **Key Features**: Level-based matching, win rate calculation, rewards, history
- **API**: 4 endpoints (enter, execute, history, rankings)

## Data Flow

### Battle Execution Flow

1. User calls POST /battle/enter
2. System checks: gold balance, settlement period, existing match
3. Deduct 100 gold entry fee
4. Find opponent (±3 levels, weighted random)
5. Calculate win rate: 50% + (myLevel - oppLevel) × 8%
6. Create match in Redis (TTL 5 minutes)
7. Return match info to client
8. User calls POST /battle/:matchId/execute
9. System determines winner based on win rate
10. Distribute gold rewards (winner: 500+bonus, loser: 50)
11. Update Redis rankings (+points for winner)
12. Update streaks (winner +1, loser reset)
13. Save battle record to database
14. Clean up Redis match data
15. Return battle result to client

### Season Settlement Flow

1. Monday 00:00 - Season ends, status → SETTLING
2. Battles blocked during settlement (00:00-07:59)
3. Retrieve top 100 from Redis ranking
4. Save rankings to database (season_rankings table)
5. Send weapon reward to rank 1 user via mail
6. Mark season as COMPLETED
7. Monday 08:00 - New season starts, status → ACTIVE

## Database Schema

### Season
- id, seasonNumber, startAt, endAt, status
- rewardWeaponTemplateId (nullable)

### SeasonRanking
- seasonId + userId (composite PK)
- totalPoints, winCount, loseCount
- currentStreak, bestStreak

### BattleRecord
- id, seasonId, winnerId, loserId
- winnerWeaponId, loserWeaponId, levels
- winRate, points, gold rewards
- winnerStreak, battleAt

## Redis Data Structures

### Rankings (Sorted Set)
- Key: `season:{seasonId}:ranking`
- Score: total points
- Member: userId
- Purpose: Real-time leaderboard

### Streaks (Hash)
- Key: `season:{seasonId}:streaks`
- Field: userId
- Value: current streak count

### Stats (Hash)
- Key: `season:{seasonId}:stats`
- Field: userId
- Value: JSON {winCount, loseCount, bestStreak}

### In-Match Flag (Set)
- Key: `battle:in_match`
- Members: userIds currently in battle
- Purpose: Prevent double-matching

### Match Data (String, TTL 5min)
- Key: `battle:match:{matchId}`
- Value: JSON match data
- Purpose: Temporary match state

## Win Rate Formula

```
winRate = 50 + (myLevel - opponentLevel) × 8
winRate = Math.max(5, Math.min(95, winRate))
```

Examples:
- Same level (0): 50%
- +3 levels: 74%
- -3 levels: 26%
- +12 levels: 95% (capped)
- -12 levels: 5% (capped)

## Reward System

### Entry Fee
- 100 gold (deducted on enter)

### Win Rewards
- Base: 500 gold + 10 points
- Streak points: +2 per current streak
- Streak gold bonuses:
  - 3 wins: +200g
  - 5 wins: +500g
  - 10 wins: +1500g
  - 20 wins: +5000g

### Loss Rewards
- 50 gold (10% of winner's base)
- 0 points
- Streak reset to 0

## Opponent Matching

### Level Range
- ±3 levels from user's weapon level

### Weighted Selection
- Same level (±0): Weight 4
- ±1 level: Weight 3
- ±2 levels: Weight 2
- ±3 levels: Weight 1

Closer levels have higher probability of being selected.

## Season Schedule

- Start: Monday 08:00
- End: Sunday 23:59
- Settlement: Monday 00:00-07:59 (battles blocked)
- Rank 1 Reward: Expires next season end

## API Endpoints

### Season Endpoints
- GET /seasons/current
- GET /seasons/:id/rankings

### Battle Endpoints
- POST /battle/enter
- POST /battle/:matchId/execute
- GET /battle/history
- GET /battle/rankings

All endpoints:
- Protected with JWT authentication
- Documented with Swagger
- Return proper HTTP status codes

## Dependencies

### Required Modules
- RedisModule: Rankings and real-time data
- MailModule: Reward distribution
- WeaponsModule: Battle weapon selection
- UsersModule: User data access
- AuthModule: JWT authentication

### External Libraries
- TypeORM: Database operations
- NestJS: Application framework
- Swagger: API documentation
- Redis: In-memory data store

## Configuration

All game balance values in `game-balance.config.ts`:
- Battle entry fee, level range, win rate formula
- Reward amounts, streak bonuses
- Season schedule, settlement times

## Error Handling

- 400: Insufficient gold, settlement period, already in battle
- 404: No weapons, no opponents, match not found
- 401: Unauthorized (no JWT token)
- 500: Server errors (logged)

## Performance Considerations

- Redis operations: O(log N) for rankings
- Battle execution: O(1) deterministic
- Matchmaking: O(N) but small N
- History queries: Indexed by userId
- Real-time updates: No polling needed

## Security

- JWT authentication on all endpoints
- User can only enter their own battles
- Match validation prevents cheating
- Entry fee deducted immediately
- All transactions atomic

## Testing

Ready for testing via:
- Swagger UI: http://localhost:3000/api
- Postman/Insomnia with JWT token
- Unit tests (to be added)
- Integration tests (to be added)

## Future Enhancements

- Automated season creation (cron jobs)
- ELO-based matchmaking
- Battle replays
- Tournament modes
- Clan/Guild battles
- Season achievements
