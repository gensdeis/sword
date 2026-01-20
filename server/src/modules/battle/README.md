# Battle Module

The Battle module implements the async PvP battle system for the Sword Growing Game.

## Features

- **Async PvP**: Battle against opponent's data (not live)
- **Level-based Matching**: Match with opponents ±3 levels
- **Weighted Matching**: Closer levels have higher probability
- **Win Rate Formula**: 50% + (myLevel - oppLevel) × 8%p (min 5%, max 95%)
- **Streak Bonuses**: Extra gold rewards for consecutive wins
- **Real-time Rankings**: Immediate Redis ranking updates
- **Battle History**: Detailed battle record tracking

## Battle Flow

1. **Enter Battle** → Pay 100 gold entry fee
2. **Match Opponent** → Find opponent ±3 levels (weighted random)
3. **Auto-Execute** → Battle executes based on win rate
4. **Distribute Rewards** → Gold + points based on result
5. **Update Rankings** → Immediate Redis ranking update

## API Endpoints

### POST /battle/enter
Enter battle and get matched with an opponent.

**Response:**
```json
{
  "matchId": "match_12345_1234567890",
  "opponent": {
    "userId": 67890,
    "username": "OpponentName",
    "weaponLevel": 5,
    "weaponName": "Legendary Sword",
    "weaponRarity": "legendary"
  },
  "entryFeePaid": 100,
  "remainingGold": 900
}
```

**Error Cases:**
- 400: Insufficient gold, already in battle, or settlement period
- 404: User has no weapons or no opponents found

### POST /battle/:matchId/execute
Execute the battle (auto-executes based on win rate).

**Response:**
```json
{
  "isWin": true,
  "pointsEarned": 12,
  "goldEarned": 700,
  "totalGold": 1600,
  "currentStreak": 6,
  "ranking": 5,
  "totalPoints": 1250,
  "winRate": 66.0,
  "opponentName": "OpponentName",
  "opponentLevel": 5
}
```

### GET /battle/history
Get your battle history.

**Query Parameters:**
- `limit` (optional): Number of battles to retrieve (default 20)

**Response:**
```json
{
  "battles": [
    {
      "id": 1,
      "isWin": true,
      "opponentName": "OpponentName",
      "myWeaponLevel": 7,
      "opponentWeaponLevel": 5,
      "winRate": 66.0,
      "pointsEarned": 12,
      "goldEarned": 700,
      "streak": 6,
      "battleAt": "2026-01-14T10:30:00.000Z"
    }
  ],
  "total": 50,
  "totalWins": 35,
  "totalLosses": 15,
  "winRate": 70.0
}
```

### GET /battle/rankings
Get current season rankings (top 100).

**Query Parameters:**
- `limit` (optional): Number of top players (default 100)

**Response:** Same as `/seasons/:id/rankings`

## Win Rate Formula

```typescript
winRate = 50 + (myLevel - opponentLevel) × 8
winRate = Math.max(5, Math.min(95, winRate))
```

**Examples:**
- Same level (0): 50%
- +3 levels: 74%
- -3 levels: 26%
- +12 levels: 95% (capped)
- -12 levels: 5% (capped)

## Reward System

### Entry Fee
- **Cost**: 100 gold (deducted when entering)

### Win Rewards
- **Base Gold**: 500
- **Base Points**: 10
- **Streak Points**: +2 per current streak
- **Streak Gold Bonuses**:
  - 3 wins: +200 gold
  - 5 wins: +500 gold
  - 10 wins: +1500 gold
  - 20 wins: +5000 gold

### Loss Rewards
- **Gold**: 50 (10% of winner's base)
- **Points**: 0
- **Streak**: Reset to 0

### Examples

**Win with 5-win streak:**
- Gold: 500 + 500 (5-win bonus) = 1000
- Points: 10 + (6 × 2) = 22

**Win with 10-win streak:**
- Gold: 500 + 1500 (10-win bonus) = 2000
- Points: 10 + (11 × 2) = 32

## Opponent Matching

### Level Range
- **Range**: ±3 levels from your weapon level
- **Example**: Level 7 can match with levels 4-10

### Weighted Selection
- **Same level (±0)**: Weight 4 (highest priority)
- **±1 level**: Weight 3
- **±2 levels**: Weight 2
- **±3 levels**: Weight 1

### Selection Algorithm
1. Find all users with weapons in level range
2. Calculate weights based on level difference
3. Randomly select opponent using weighted probability
4. Closer levels have higher chance of being selected

## Service Methods

### Battle Flow
- `enterBattle(userId)` - Pay entry fee, find opponent
- `findOpponent(myLevel, myUserId)` - Get opponents ±3 levels
- `executeBattle(userId, matchId)` - Simulate battle
- `determineBattleResult(winRate)` - Random true/false based on win rate

### Rewards & Rankings
- `distributeBattleRewards(winnerId, loserId, winnerStreak)` - Give gold
- `updateRankings(seasonId, winnerId, loserId, points)` - Update Redis
- `saveBattleRecord(battleData)` - Save to DB

### History
- `getBattleHistory(userId, limit)` - Get battle records
- `getCurrentRankings(limit)` - Get current season rankings

## Redis Data Structure

### In-Match Flag (Set)
```
Key: battle:in_match
Member: userId
Purpose: Prevent double-matching
```

### Match Data (String, TTL 5 min)
```
Key: battle:match:{matchId}
Value: JSON { userId, opponentId, weaponIds, levels, winRate }
TTL: 300 seconds
```

### Rankings (Sorted Set)
```
Key: season:{seasonId}:ranking
Score: total points
Member: userId
```

## Settlement Period

**Blocked During**: Monday 00:00 - 07:59

When user tries to enter battle during settlement:
```json
{
  "statusCode": 400,
  "message": "Battles are not available during settlement period (Monday 00:00 - 07:59)"
}
```

## Configuration

All battle settings are defined in `game-balance.config.ts`:

```typescript
BATTLE: {
  ENTRY_FEE: 100,
  MATCHING_LEVEL_RANGE: 3,

  WIN_RATE: {
    BASE: 50,
    PER_LEVEL_DIFF: 8,
    MIN: 5,
    MAX: 95,
  },

  REWARDS: {
    WIN_GOLD: 500,
    WIN_POINTS: 10,
    STREAK_BONUS_POINTS: 2,
    LOSE_GOLD_RATE: 0.1,
    STREAK_GOLD_BONUS: {
      3: 200,
      5: 500,
      10: 1500,
      20: 5000,
    },
  },
}
```

## Dependencies

- **WeaponsModule**: Get user's battle weapon
- **SeasonModule**: Check season status, manage streaks
- **RedisModule**: Rankings, match data, in-match flags
- **TypeORM**: Battle records, user data

## Database Entities

### BattleRecord
- id, seasonId, winnerId, loserId
- winnerWeaponId, loserWeaponId
- winnerWeaponLevel, loserWeaponLevel
- winRate, winnerPointsEarned, winnerGoldEarned
- loserGoldEarned, winnerStreak
- battleAt timestamp

## Error Handling

- **Insufficient Gold**: Cannot pay entry fee
- **No Weapons**: User has no weapons for battle
- **No Opponents**: No users in level range
- **Settlement Period**: Battles blocked Mon 00:00-07:59
- **Already In Battle**: User already has active match
- **Invalid Match**: Match not found or expired
- **No Active Season**: Cannot battle without active season

## Battle Record Tracking

All battles are saved to the database with:
- Both users (winner/loser)
- Both weapons used
- Win rate for the battle
- Rewards distributed
- Winner's streak at time of battle
- Timestamp

This allows for:
- Historical analysis
- Win rate statistics
- Weapon performance tracking
- User battle history
