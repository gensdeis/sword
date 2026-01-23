import { ApiProperty } from '@nestjs/swagger';

export class UserRankingDto {
  @ApiProperty({ example: 1, description: 'User rank position' })
  rank: number;

  @ApiProperty({ example: 12345, description: 'User ID' })
  userId: number;

  @ApiProperty({ example: 'PlayerOne', description: 'Username' })
  username: string;

  @ApiProperty({ example: 1250, description: 'Total points earned' })
  totalPoints: number;

  @ApiProperty({ example: 45, description: 'Number of wins' })
  winCount: number;

  @ApiProperty({ example: 12, description: 'Number of losses' })
  loseCount: number;

  @ApiProperty({ example: 5, description: 'Current win streak' })
  currentStreak: number;

  @ApiProperty({ example: 15, description: 'Best win streak achieved' })
  bestStreak: number;

  @ApiProperty({ example: 15, description: 'Maximum enhancement level achieved this season' })
  maxEnhancementLevel: number;
}

export class RankingResponseDto {
  @ApiProperty({ example: 1, description: 'Season ID' })
  seasonId: number;

  @ApiProperty({ type: [UserRankingDto], description: 'List of user rankings' })
  rankings: UserRankingDto[];

  @ApiProperty({ example: 100, description: 'Total number of participants' })
  totalParticipants: number;
}
