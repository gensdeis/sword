/**
 * Game Balance Configuration
 * All game balance values are defined here for easy tuning
 */

export const GAME_CONFIG = {
  // === Weapon System ===
  WEAPON: {
    MAX_SLOTS: 10,
    MAX_ENHANCEMENT_LEVEL: 20,
  },

  // === Gacha System ===
  GACHA: {
    FIRST_PULL_COST: 1000,
    REROLL_BASE_COST: 300,
    REROLL_INCREMENT: 200,
    MAX_REROLL_COUNT: 5,

    RATES: {
      common: 50,
      rare: 30,
      epic: 15,
      legendary: 5,
    },
  },

  // === Enhancement System ===
  ENHANCEMENT: {
    // [success%, maintain%, destruction%]
    RATES_BY_LEVEL: {
      0: [70, 28, 2],
      1: [65, 32, 3],
      2: [60, 35, 5],
      3: [55, 37, 8],
      4: [50, 38, 12],
      5: [45, 40, 15],
      6: [40, 42, 18],
      7: [35, 43, 22],
      8: [30, 43, 27],
      9: [25, 42, 33],
      10: [20, 40, 40],
      11: [18, 37, 45],
      12: [15, 35, 50],
      13: [12, 33, 55],
      14: [10, 30, 60],
      15: [10, 30, 60],
      16: [8, 27, 65],
      17: [6, 24, 70],
      18: [4, 21, 75],
      19: [2, 18, 80],
      20: [1, 14, 85],
    },

    DOUBLE_JUMP: {
      ELIGIBLE_RARITIES: ['legendary'],
      RATE: 15, // 15% chance for 2-level enhancement on success
    },

    // Min/Max rate constraints
    MIN_SUCCESS_RATE: 5,
    MAX_SUCCESS_RATE: 75,
    MIN_DESTRUCTION_RATE: 1,
    MAX_DESTRUCTION_RATE: 65,

    // Enhancement Costs
    COSTS: {
      GOLD_UNTIL_LEVEL: 10,
      BASE_GOLD_COST: 100,
      GOLD_COST_PER_LEVEL: 50,
      BASE_STONE_COST: 1,
      STONE_COST_PER_LEVEL: 1,
    },
  },

  // === Prayer System ===
  PRAYER: {
    GENERATION_RATES: {
      POSITIVE: 30, // Success rate buff
      NEGATIVE: 30, // Destruction rate debuff
      NEUTRAL: 40, // No effect
    },

    EFFECTS: {
      SUCCESS_PER_BUFF: 1, // +1%p to success rate per positive buff
      DESTRUCTION_PER_BUFF: 0.5, // +0.5%p to destruction rate per negative buff
    },

    POOL_LIMITS: {
      MAX_POSITIVE: 50,
      MAX_NEGATIVE: 50,
      MAX_NEUTRAL: 100,
    },

    // Redis keys
    REDIS_KEYS: {
      POOL: 'global:prayer:pool',
      POSITIVE: 'positiveBuffs',
      NEGATIVE: 'negativeBuffs',
      NEUTRAL: 'neutrals',
    },
  },

  // === Battle System ===
  BATTLE: {
    ENTRY_FEE: 100,
    MATCHING_LEVEL_RANGE: 3, // ±3 levels

    WIN_RATE: {
      BASE: 50, // Base 50%
      PER_LEVEL_DIFF: 8, // ±8%p per level difference
      MIN: 5, // Minimum 5% win rate
      MAX: 95, // Maximum 95% (never 100%)
    },

    REWARDS: {
      WIN_GOLD: 500,
      WIN_POINTS: 10,
      STREAK_BONUS_POINTS: 2, // +2pt per win streak

      LOSE_GOLD_RATE: 0.1, // 10% of winner's gold

      STREAK_GOLD_BONUS: {
        3: 200,
        5: 500,
        10: 1500,
        20: 5000,
      },
    },

    // Redis keys
    REDIS_KEYS: {
      QUEUE: 'battle:queue',
      IN_MATCH: 'battle:in_match',
      RANKING: (seasonId: number) => `season:${seasonId}:ranking`,
    },
  },

  // === Season System ===
  SEASON: {
    START_DAY: 1, // Monday
    START_HOUR: 8, // 08:00
    END_DAY: 0, // Sunday
    END_HOUR: 23, // 23:59
    END_MINUTE: 59,

    SETTLEMENT_START: 0, // Monday 00:00
    SETTLEMENT_END: 7, // 07:59

    RANK_1_REWARD_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Redis keys
    REDIS_KEYS: {
      REWARDS_SENT: (seasonId: number) => `season:${seasonId}:rewards:sent`,
    },
  },

  // === Attendance System ===
  ATTENDANCE: {
    DAILY_GOLD: 60000,
  },

  // === Sell System ===
  SELL_PRICES: {
    common: { base: 10, per_level: 5 },
    rare: { base: 30, per_level: 15 },
    epic: { base: 100, per_level: 50 },
    legendary: { base: 500, per_level: 200 },
  },

  // === Mail System ===
  MAIL: {
    DEFAULT_EXPIRE_DAYS: 7,
    SEASON_REWARD_EXPIRE_TYPE: 'next_season_end',
  },
};

/**
 * Helper function to get enhancement rates by level
 */
export function getEnhancementRates(level: number): {
  success: number;
  maintain: number;
  destruction: number;
} {
  const rates = GAME_CONFIG.ENHANCEMENT.RATES_BY_LEVEL[level] || [10, 30, 60];
  return {
    success: rates[0],
    maintain: rates[1],
    destruction: rates[2],
  };
}

/**
 * Helper function to calculate gacha reroll cost
 */
export function getRerollCost(rerollCount: number): number | null {
  if (rerollCount >= GAME_CONFIG.GACHA.MAX_REROLL_COUNT) {
    return null; // No more rerolls allowed
  }

  return (
    GAME_CONFIG.GACHA.REROLL_BASE_COST +
    rerollCount * GAME_CONFIG.GACHA.REROLL_INCREMENT
  );
}

/**
 * Helper function to calculate enhancement cost
 */
export function calculateEnhancementCost(level: number): {
  gold: number;
  stones: number;
} {
  const { COSTS } = GAME_CONFIG.ENHANCEMENT;

  if (level < COSTS.GOLD_UNTIL_LEVEL) {
    return {
      gold: COSTS.BASE_GOLD_COST + level * COSTS.GOLD_COST_PER_LEVEL,
      stones: 0,
    };
  } else {
    return {
      gold: 0,
      stones: COSTS.BASE_STONE_COST + (level - COSTS.GOLD_UNTIL_LEVEL) * COSTS.STONE_COST_PER_LEVEL,
    };
  }
}

/**
 * Helper function to calculate weapon sell price
 */
export function calculateSellPrice(
  rarity: 'common' | 'rare' | 'epic' | 'legendary',
  enhancementLevel: number,
): number {
  const config = GAME_CONFIG.SELL_PRICES[rarity];
  return config.base + config.per_level * enhancementLevel;
}

/**
 * Helper function to calculate battle win rate
 */
export function calculateWinRate(
  myLevel: number,
  opponentLevel: number,
): number {
  const levelDiff = myLevel - opponentLevel;
  const config = GAME_CONFIG.BATTLE.WIN_RATE;

  let winRate = config.BASE + levelDiff * config.PER_LEVEL_DIFF;

  // Apply min/max constraints
  winRate = Math.min(Math.max(winRate, config.MIN), config.MAX);

  return winRate;
}

/**
 * Helper function to calculate battle rewards
 */
export function calculateBattleRewards(
  isWin: boolean,
  currentStreak: number,
): {
  gold: number;
  points: number;
  loserGold?: number;
} {
  const config = GAME_CONFIG.BATTLE.REWARDS;

  if (isWin) {
    let goldReward = config.WIN_GOLD;
    let pointsReward = config.WIN_POINTS;

    // Add streak bonus points
    pointsReward += currentStreak * config.STREAK_BONUS_POINTS;

    // Add streak gold bonus
    if (config.STREAK_GOLD_BONUS[currentStreak]) {
      goldReward += config.STREAK_GOLD_BONUS[currentStreak];
    }

    return {
      gold: goldReward,
      points: pointsReward,
      loserGold: Math.floor(goldReward * config.LOSE_GOLD_RATE),
    };
  } else {
    // Loser rewards
    const winnerGold = config.WIN_GOLD;
    return {
      gold: Math.floor(winnerGold * config.LOSE_GOLD_RATE),
      points: 0,
    };
  }
}
