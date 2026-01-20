# Quick Start Guide - Enhancement & Prayer Modules

## Getting Started

### Prerequisites
- Node.js installed
- Redis server running
- MySQL database set up
- Environment variables configured

### Installation
```bash
cd server
npm install
```

### Database Setup
Ensure these tables exist (should be in migrations):
- `prayer_history`
- `enhancement_history`
- `user_weapons`
- `users`

### Start Server
```bash
npm run start:dev
```

Server will start on `http://localhost:3000`
Swagger docs available at `http://localhost:3000/api`

## Quick Test with Swagger UI

### 1. Test Prayer System

1. Open `http://localhost:3000/api`
2. Navigate to **Prayer** section
3. Try `POST /prayer/pray`:
   - Click "Try it out"
   - Click "Execute"
   - Should return: `{"message": "기도를 올렸습니다...", "globalPoolSize": 1}`

4. Try `GET /prayer/pool`:
   - Click "Try it out"
   - Click "Execute"
   - Should return pool statistics

5. Perform multiple prayers to build up the pool

### 2. Test Enhancement System

1. First, you need a weapon in database:
```sql
-- Create test user if not exists
INSERT INTO users (username, email, password_hash, seed_salt, gold)
VALUES ('testuser', 'test@test.com', 'hash', 'random-salt-123', 10000);

-- Create test weapon template if not exists
INSERT INTO weapon_templates (name, rarity, base_attack, sell_price_base, sell_price_per_level)
VALUES ('Test Sword', 'legendary', 100, 500, 200);

-- Create user weapon
INSERT INTO user_weapons (user_id, weapon_template_id, enhancement_level, is_equipped)
VALUES (1, 1, 0, true);
```

2. In Swagger UI, navigate to **Enhancement** section

3. Try `POST /weapons/{id}/enhance`:
   - Click "Try it out"
   - Enter weapon ID (e.g., 1)
   - Click "Execute"
   - Response shows result, new level, rates used, prayer effect

4. Try `GET /enhancement/history`:
   - Click "Try it out"
   - Optional: Set limit (e.g., 10)
   - Click "Execute"
   - See all enhancement attempts

## Testing with cURL

### Prayer
```bash
# Perform a prayer
curl -X POST http://localhost:3000/prayer/pray

# Get pool stats
curl -X GET http://localhost:3000/prayer/pool
```

### Enhancement
```bash
# Enhance weapon ID 1
curl -X POST http://localhost:3000/weapons/1/enhance

# Get enhancement history
curl -X GET http://localhost:3000/enhancement/history?limit=20
```

## Testing Enhancement Mechanics

### Test Basic Enhancement
```bash
# Enhance a level 0 weapon (70% success, 28% maintain, 2% destruction)
curl -X POST http://localhost:3000/weapons/1/enhance
```

### Test with Prayer Effects

1. Build up prayer pool:
```bash
# Add 20 prayers
for i in {1..20}; do
  curl -X POST http://localhost:3000/prayer/pray
done
```

2. Check pool distribution:
```bash
curl -X GET http://localhost:3000/prayer/pool
```

3. Enhance weapon (will consume random prayer):
```bash
curl -X POST http://localhost:3000/weapons/1/enhance
```

### Test Legendary Double Jump

1. Create a legendary weapon at high level
2. Enhance it multiple times
3. ~15% of successes should give +2 levels

### Test Destruction

1. Create weapon at high level (e.g., level 10+)
2. Enhance repeatedly
3. Eventually it will be destroyed
4. Try to enhance destroyed weapon → should get 400 error

## Monitoring Redis

### Connect to Redis CLI
```bash
redis-cli
```

### Check Prayer Pool
```redis
# Get all pool data
HGETALL global:prayer:pool

# Get specific field
HGET global:prayer:pool positiveBuffs

# Clear pool (for testing)
DEL global:prayer:pool
```

### Verify Pool After Operations
```bash
# Add 10 prayers
for i in {1..10}; do curl -X POST http://localhost:3000/prayer/pray; done

# Check Redis
redis-cli HGETALL global:prayer:pool
```

## Debugging

### Check Logs
```bash
# Server logs show:
# - Redis connection status
# - Prayer pool initialization
# - Enhancement attempts
# - Errors/warnings
```

### Common Issues

**Redis not connected:**
```
Error: Redis connection failed
Solution: Ensure Redis is running (redis-server)
```

**Weapon not found:**
```
Error: 404 - Weapon not found
Solution: Check weapon exists and belongs to user
```

**Cannot enhance destroyed weapon:**
```
Error: 400 - Cannot enhance destroyed weapon
Solution: Weapon was destroyed in previous enhancement
```

**Max level reached:**
```
Error: 400 - Weapon is already at max level
Solution: Weapon is at level 15 (max)
```

## Development Workflow

### Making Changes

1. **Modify rates:**
   - Edit `src/config/game-balance.config.ts`
   - No restart needed (hot reload)

2. **Add new features:**
   - Edit service files
   - Update DTOs if needed
   - Add to controller
   - Update Swagger docs

3. **Test changes:**
   - Use Swagger UI
   - Check Redis state
   - Verify database records

### Database Inspection

```sql
-- Check recent prayers
SELECT * FROM prayer_history
ORDER BY prayed_at DESC
LIMIT 10;

-- Check enhancement history
SELECT * FROM enhancement_history
ORDER BY enhanced_at DESC
LIMIT 10;

-- Check prayer consumption rate
SELECT
  COUNT(*) as total,
  SUM(was_consumed) as consumed,
  (SUM(was_consumed) / COUNT(*)) * 100 as consumption_rate
FROM prayer_history;

-- Check enhancement success rates
SELECT
  result,
  COUNT(*) as count,
  (COUNT(*) / (SELECT COUNT(*) FROM enhancement_history)) * 100 as percentage
FROM enhancement_history
GROUP BY result;

-- Check average rates by prayer effect
SELECT
  prayer_effect,
  AVG(success_rate) as avg_success,
  AVG(destruction_rate) as avg_destruction,
  COUNT(*) as count
FROM enhancement_history
GROUP BY prayer_effect;
```

## Performance Testing

### Load Test Prayer System
```bash
# Add 1000 prayers quickly
for i in {1..1000}; do
  curl -X POST http://localhost:3000/prayer/pray &
done
wait

# Check pool limits were respected
curl -X GET http://localhost:3000/prayer/pool
# positiveBuffs should be ≤ 50
# negativeBuffs should be ≤ 50
# neutrals should be ≤ 100
```

### Load Test Enhancement
```bash
# Create 100 weapons and enhance each
# (Need proper setup script)
```

## Integration with Frontend

### Prayer Button
```typescript
async function performPrayer() {
  const response = await fetch('http://localhost:3000/prayer/pray', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  // Show: data.message
  // Show: "Pool size: " + data.globalPoolSize
}
```

### Enhancement Button
```typescript
async function enhanceWeapon(weaponId: number) {
  const response = await fetch(`http://localhost:3000/weapons/${weaponId}/enhance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (data.result === 'success') {
    // Show success animation
    // Update weapon level to data.newLevel
    // If data.levelIncrease === 2, show "DOUBLE!"
  } else if (data.result === 'maintain') {
    // Show maintain message
  } else if (data.result === 'destroyed') {
    // Show destruction animation
    // Remove weapon from inventory
  }

  // Show rates used:
  // "Success rate: " + data.successRate + "%"
  // "Destruction rate: " + data.destructionRate + "%"
  // "Prayer effect: " + data.prayerEffect
}
```

### Enhancement History Display
```typescript
async function getHistory() {
  const response = await fetch('http://localhost:3000/enhancement/history?limit=50', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();

  // Display data.history array in table
  // Show: fromLevel → toLevel, result, rates, timestamp
}
```

## Troubleshooting

### Reset Everything
```bash
# Clear Redis
redis-cli FLUSHDB

# Truncate history tables
mysql -u root -p sword_game <<EOF
TRUNCATE TABLE prayer_history;
TRUNCATE TABLE enhancement_history;
UPDATE user_weapons SET is_destroyed = FALSE, destroyed_at = NULL;
EOF

# Restart server
npm run start:dev
```

### Check System Status
```bash
# Redis up?
redis-cli PING  # Should return PONG

# Database up?
mysql -u root -p -e "SELECT 1"

# Server up?
curl http://localhost:3000/prayer/pool
```

## Next Steps

1. Run through all test scenarios
2. Add authentication (uncomment guards)
3. Write unit tests
4. Integrate with frontend
5. Add monitoring/analytics
6. Deploy to production

## Support

For issues, check:
1. Server logs in terminal
2. Redis data with `redis-cli`
3. Database records with SQL queries
4. Swagger UI for API testing

---

Happy coding! 🎮⚔️
