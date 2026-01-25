// User types
export interface User {
  id: number;
  username: string;
  email: string;
  gold: number;
  enhancementStones: number;
  currentSeasonId?: number;
  consecutiveAttendanceDays: number;
  lastAttendanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Weapon types
export enum WeaponRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface Weapon {
  id: number;
  userId: number;
  weaponTemplateId: number;
  weaponName: string;
  rarity: WeaponRarity;
  baseAttack: number;
  enhancementLevel: number;
  currentAttack: number;
  isEquipped: boolean;
  isDestroyed: boolean;
  acquiredAt: string;
  imageUrl?: string;
  canDoubleEnhance: boolean;
  doubleEnhanceRate: number;
  description: string;
}

export interface WeaponPullResult {
  weapon: Weapon;
  isNew: boolean;
}

export interface GachaSession {
  sessionId: string;
  weapon: Weapon;
  rerollCount: number;
  rerollCost: number;
  canReroll: boolean;
}

// Battle types
export interface Opponent {
  userId: number;
  username: string;
  weaponLevel: number;
  weaponName: string;
  weaponRarity: WeaponRarity;
  winRate: number;
}

export interface BattleEnterResponse {
  matchId: string;
  opponent: Opponent;
  entryFeePaid: number;
  remainingGold: number;
}

export interface BattleRequest {
  matchId: string;
}

export interface BattleResult {
  isWin: boolean;
  pointsEarned: number;
  goldEarned: number;
  totalGold: number;
  currentStreak: number;
  ranking: number;
  totalPoints: number;
  winRate: number;
  opponentName: string;
  opponentLevel: number;
}

// Ranking types
export interface RankingEntry {
  rank: number;
  userId: number;
  username: string;
  totalVictories: number;
  consecutiveVictories: number;
}

export interface SeasonInfo {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Mail types
export interface Mail {
  id: number;
  userId: number;
  title: string;
  content: string;
  rewardGold?: number;
  rewardStones?: number;
  isRead: boolean;
  isClaimed: boolean;
  expiresAt?: string;
  createdAt: string;
}

// API Response types
export * from './api';

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
