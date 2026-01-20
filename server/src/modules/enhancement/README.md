# Enhancement Module

## Overview
The Enhancement Module handles weapon enhancement logic with integration to the prayer pool system.

## Features

### Enhancement System
- Level-based success/maintain/destruction rates
- Maximum level: 15
- Legendary weapons: 15% chance for +2 levels on success
- Prayer effects modify enhancement rates
- Deterministic seeded random for fairness

### Enhancement Results
- **Success**: Level increases by 1 (or 2 for legendary with double jump)
- **Maintain**: Level stays the same
- **Destroyed**: Weapon is destroyed (cannot be used/equipped)

### Prayer Integration
- Automatically consumes one effect from global prayer pool
- **Positive**: +5%p success rate
- **Negative**: +3%p destruction rate
- **Neutral**: No effect
- **None**: Pool was empty, no effect

### Rate Constraints
- Success rate: 5% - 75%
- Destruction rate: 1% - 65%
- Maintain rate: Adjusted to make total = 100%

## API Endpoints

### POST /weapons/:id/enhance
Enhance a weapon.

**Parameters:**
- `id`: Weapon ID (path parameter)

**Response:**
```json
{
  "result": "success",
  "newLevel": 5,
  "levelIncrease": 1,
  "weapon": { /* UserWeapon object */ },
  "successRate": 45.5,
  "destructionRate": 15.5,
  "prayerEffect": "positive"
}
```

### GET /enhancement/history
Get user's enhancement history.

**Query Parameters:**
- `limit`: Maximum records to return (default: 50)

**Response:**
```json
{
  "history": [
    {
      "id": 123,
      "userWeaponId": 456,
      "fromLevel": 4,
      "toLevel": 5,
      "result": "success",
      "successRate": 45.5,
      "destructionRate": 15.5,
      "prayerEffect": "positive",
      "enhancedAt": "2024-01-15T12:34:56.789Z"
    }
  ],
  "total": 42
}
```

## Implementation Details

### Seeded Random Generation
For fairness and to prevent manipulation, enhancement uses deterministic seeded random:

```typescript
// Seed = hash(userSeedSalt + timestamp + weaponId)
const seed = generateRandomSeed(userSeedSalt, weaponId);
const random = seededRandom(seed);
```

### Rate Calculation Flow
1. Get base rates for current level from config
2. Apply prayer effect modifiers
3. Apply min/max constraints
4. Adjust maintain rate to ensure total = 100%

### Double Enhancement
Legendary weapons have a 15% chance for +2 level jump on success:
- Only applies if result is SUCCESS
- Only for legendary rarity weapons
- Won't exceed max level (15)
- Independent random roll after success determination

### Database Records
All enhancement attempts are recorded in `enhancement_history`:
- Original weapon level
- Result level (null if destroyed)
- Enhancement result
- Rates used
- Prayer effect applied
- Timestamp

### Destroyed Weapons
When a weapon is destroyed:
- `isDestroyed` set to `true`
- `destroyedAt` timestamp set
- Auto-unequipped if currently equipped
- Cannot be enhanced again
- Still visible in inventory but unusable

## Usage Example

```typescript
// In your service
constructor(private enhancementService: EnhancementService) {}

// Enhance weapon
const result = await this.enhancementService.enhanceWeapon(userId, weaponId);

// Get history
const history = await this.enhancementService.getEnhancementHistory(userId, 20);
```

## Base Enhancement Rates

Level-based rates (before prayer effects):

| Level | Success | Maintain | Destruction |
|-------|---------|----------|-------------|
| 0     | 70%     | 28%      | 2%          |
| 1     | 65%     | 32%      | 3%          |
| 2     | 60%     | 35%      | 5%          |
| 3     | 55%     | 37%      | 8%          |
| 4     | 50%     | 38%      | 12%         |
| 5     | 45%     | 40%      | 15%         |
| 6     | 40%     | 42%      | 18%         |
| 7     | 35%     | 43%      | 22%         |
| 8     | 30%     | 43%      | 27%         |
| 9     | 25%     | 42%      | 33%         |
| 10    | 20%     | 40%      | 40%         |
| 11    | 18%     | 37%      | 45%         |
| 12    | 15%     | 35%      | 50%         |
| 13    | 12%     | 33%      | 55%         |
| 14    | 10%     | 30%      | 60%         |
| 15    | 10%     | 30%      | 60%         |

## Configuration
All enhancement-related configuration is in `config/game-balance.config.ts`:
- `ENHANCEMENT.RATES_BY_LEVEL`: Base rates for each level
- `ENHANCEMENT.DOUBLE_JUMP`: Legendary double enhancement settings
- `ENHANCEMENT.MIN_SUCCESS_RATE/MAX_SUCCESS_RATE`: Rate constraints
- `ENHANCEMENT.MIN_DESTRUCTION_RATE/MAX_DESTRUCTION_RATE`: Rate constraints
- `WEAPON.MAX_ENHANCEMENT_LEVEL`: Maximum enhancement level
