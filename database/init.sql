-- Sword Growing Game Database Schema
-- Created: 2026-01-14

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `gold` BIGINT DEFAULT 1000,
  `enhancement_stones` INT DEFAULT 0,
  `seed_salt` VARCHAR(64) NOT NULL COMMENT 'Random seed for enhancement',
  `daily_prayer_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Weapon Templates (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS `weapon_templates` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `rarity` ENUM('common', 'rare', 'epic', 'legendary') NOT NULL,
  `base_attack` INT NOT NULL,
  `can_double_enhance` BOOLEAN DEFAULT FALSE COMMENT 'Can enhance 2 levels at once',
  `double_enhance_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Probability for 2-level enhancement',
  `sell_price_base` INT NOT NULL COMMENT 'Base sell price in stones',
  `sell_price_per_level` INT NOT NULL COMMENT 'Additional stones per enhancement level',
  `description` TEXT,
  `image_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rarity` (`rarity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- User Weapons (Inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS `user_weapons` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `weapon_template_id` INT NOT NULL,
  `enhancement_level` INT DEFAULT 0,
  `is_equipped` BOOLEAN DEFAULT FALSE,
  `is_destroyed` BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
  `acquired_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `destroyed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`weapon_template_id`) REFERENCES `weapon_templates`(`id`),
  INDEX `idx_user_active` (`user_id`, `is_destroyed`),
  INDEX `idx_user_equipped` (`user_id`, `is_equipped`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Enhancement History
-- ============================================
CREATE TABLE IF NOT EXISTS `enhancement_history` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_weapon_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `from_level` INT NOT NULL,
  `to_level` INT,
  `result` ENUM('success', 'maintain', 'destroyed') NOT NULL,
  `success_rate` DECIMAL(5,2) NOT NULL,
  `destruction_rate` DECIMAL(5,2) NOT NULL,
  `prayer_effect` ENUM('positive', 'negative', 'neutral', 'none') DEFAULT 'none',
  `positive_buffs` INT DEFAULT 0,
  `negative_buffs` INT DEFAULT 0,
  `enhanced_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_weapon_id`) REFERENCES `user_weapons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_weapon` (`user_weapon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Seasons
-- ============================================
CREATE TABLE IF NOT EXISTS `seasons` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `season_number` INT UNIQUE NOT NULL,
  `start_at` TIMESTAMP NOT NULL,
  `end_at` TIMESTAMP NOT NULL,
  `status` ENUM('upcoming', 'active', 'settling', 'completed') DEFAULT 'upcoming',
  `reward_weapon_template_id` INT COMMENT 'Rank 1 reward weapon',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reward_weapon_template_id`) REFERENCES `weapon_templates`(`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_dates` (`start_at`, `end_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Battle Records
-- ============================================
CREATE TABLE IF NOT EXISTS `battle_records` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `season_id` INT NOT NULL,
  `winner_id` BIGINT NOT NULL,
  `loser_id` BIGINT NOT NULL,
  `winner_weapon_id` BIGINT NOT NULL,
  `loser_weapon_id` BIGINT NOT NULL,
  `winner_weapon_level` INT NOT NULL,
  `loser_weapon_level` INT NOT NULL,
  `win_rate` DECIMAL(5,2) NOT NULL COMMENT 'Calculated win probability',
  `winner_points_earned` INT NOT NULL,
  `winner_gold_earned` INT NOT NULL,
  `loser_gold_earned` INT NOT NULL,
  `winner_streak` INT DEFAULT 1,
  `battle_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`),
  FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`loser_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`winner_weapon_id`) REFERENCES `user_weapons`(`id`),
  FOREIGN KEY (`loser_weapon_id`) REFERENCES `user_weapons`(`id`),
  INDEX `idx_season_user` (`season_id`, `winner_id`),
  INDEX `idx_season_loser` (`season_id`, `loser_id`),
  INDEX `idx_battle_date` (`battle_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Season Rankings (Cached)
-- ============================================
CREATE TABLE IF NOT EXISTS `season_rankings` (
  `season_id` INT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `total_points` INT DEFAULT 0,
  `win_count` INT DEFAULT 0,
  `lose_count` INT DEFAULT 0,
  `current_streak` INT DEFAULT 0,
  `best_streak` INT DEFAULT 0,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`season_id`, `user_id`),
  FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_ranking` (`season_id`, `total_points` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Mail System
-- ============================================
CREATE TABLE IF NOT EXISTS `mails` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT,
  `reward_type` ENUM('gold', 'weapon', 'stones', 'multiple') NOT NULL,
  `reward_weapon_template_id` INT,
  `reward_gold` INT DEFAULT 0,
  `reward_stones` INT DEFAULT 0,
  `is_claimed` BOOLEAN DEFAULT FALSE,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reward_weapon_template_id`) REFERENCES `weapon_templates`(`id`),
  INDEX `idx_user_active` (`user_id`, `is_deleted`, `expires_at`),
  INDEX `idx_user_unclaimed` (`user_id`, `is_claimed`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Attendance Records
-- ============================================
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `user_id` BIGINT NOT NULL,
  `check_date` DATE NOT NULL,
  `reward_gold` INT NOT NULL,
  `checked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `check_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_date` (`user_id`, `check_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Game Configuration
-- ============================================
CREATE TABLE IF NOT EXISTS `game_config` (
  `config_key` VARCHAR(100) PRIMARY KEY,
  `config_value` TEXT NOT NULL,
  `description` VARCHAR(500),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Gacha History
-- ============================================
CREATE TABLE IF NOT EXISTS `gacha_history` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `weapon_template_id` INT NOT NULL,
  `cost_gold` INT NOT NULL,
  `reroll_count` INT DEFAULT 0,
  `was_kept` BOOLEAN DEFAULT FALSE,
  `pulled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`weapon_template_id`) REFERENCES `weapon_templates`(`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_pull_date` (`pulled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Prayer History
-- ============================================
CREATE TABLE IF NOT EXISTS `prayer_history` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `result` ENUM('positive', 'negative', 'neutral') NOT NULL,
  `was_consumed` BOOLEAN DEFAULT FALSE COMMENT 'Was this prayer used in enhancement',
  `prayed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `consumed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_pray_date` (`prayed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Game Configuration
-- ============================================
INSERT INTO `game_config` (`config_key`, `config_value`, `description`) VALUES
('max_weapon_slots', '10', 'Maximum weapon inventory slots per user'),
('max_enhancement_level', '15', 'Maximum enhancement level'),
('gacha_first_cost', '1000', 'First gacha pull cost in gold'),
('gacha_reroll_base', '300', 'Base reroll cost in gold'),
('gacha_reroll_increment', '200', 'Reroll cost increment per reroll'),
('gacha_max_reroll', '5', 'Maximum reroll count'),
('battle_entry_fee', '100', 'Battle entry fee in gold'),
('battle_win_gold', '500', 'Gold reward for winning battle'),
('battle_win_points', '10', 'Points reward for winning battle'),
('battle_streak_bonus_points', '2', 'Additional points per win streak'),
('battle_lose_gold_rate', '0.1', 'Loser gold reward rate (10% of winner gold)'),
('battle_matching_range', '3', 'Level range for matchmaking'),
('prayer_positive_rate', '30', 'Probability for positive prayer result (%)'),
('prayer_negative_rate', '30', 'Probability for negative prayer result (%)'),
('prayer_neutral_rate', '40', 'Probability for neutral prayer result (%)'),
('prayer_success_bonus', '5', 'Enhancement success rate bonus from prayer (%p)'),
('prayer_destruction_penalty', '3', 'Enhancement destruction rate penalty from prayer (%p)'),
('attendance_daily_gold', '60000', 'Daily attendance check reward in gold');

-- ============================================
-- Insert Sample Weapon Templates
-- ============================================
INSERT INTO `weapon_templates` (`name`, `rarity`, `base_attack`, `can_double_enhance`, `double_enhance_rate`, `sell_price_base`, `sell_price_per_level`, `description`) VALUES
-- Common Weapons (50%)
('녹슨 검', 'common', 10, FALSE, 0.00, 10, 5, '오래되어 녹슨 검. 기본적인 공격만 가능하다.'),
('나무 검', 'common', 12, FALSE, 0.00, 10, 5, '나무로 만든 연습용 검.'),
('철 검', 'common', 15, FALSE, 0.00, 10, 5, '평범한 철로 만든 검.'),
('단검', 'common', 13, FALSE, 0.00, 10, 5, '작지만 날카로운 단검.'),
('청동 검', 'common', 14, FALSE, 0.00, 10, 5, '청동으로 제작된 검.'),

-- Rare Weapons (30%)
('강철 검', 'rare', 25, FALSE, 0.00, 30, 15, '단단한 강철로 제작된 검.'),
('은빛 검', 'rare', 28, FALSE, 0.00, 30, 15, '은빛으로 빛나는 아름다운 검.'),
('기사의 검', 'rare', 30, FALSE, 0.00, 30, 15, '기사들이 사용하는 검.'),
('장검', 'rare', 27, FALSE, 0.00, 30, 15, '긴 날을 가진 검.'),
('쌍수검', 'rare', 26, FALSE, 0.00, 30, 15, '양손으로 휘두르는 큰 검.'),

-- Epic Weapons (15%)
('마법 검', 'epic', 50, FALSE, 0.00, 100, 50, '마법이 깃든 신비로운 검.'),
('용의 검', 'epic', 55, FALSE, 0.00, 100, 50, '용의 힘이 깃든 검.'),
('저주받은 검', 'epic', 52, FALSE, 0.00, 100, 50, '저주가 걸린 강력한 검.'),
('성검', 'epic', 53, FALSE, 0.00, 100, 50, '신성한 힘이 깃든 검.'),

-- Legendary Weapons (5%)
('엑스칼리버', 'legendary', 100, TRUE, 15.00, 500, 200, '전설의 왕이 사용했던 검.'),
('무라마사', 'legendary', 95, TRUE, 15.00, 500, 200, '요도 무라마사. 사용자를 광기로 몰아넣는다.'),
('듀란달', 'legendary', 98, TRUE, 15.00, 500, 200, '부서지지 않는 전설의 검.');

-- ============================================
-- Create Initial Season
-- ============================================
INSERT INTO `seasons` (`season_number`, `start_at`, `end_at`, `status`, `reward_weapon_template_id`) VALUES
(1, '2026-01-20 08:00:00', '2026-01-26 23:59:59', 'upcoming', 17);

SET FOREIGN_KEY_CHECKS = 1;
