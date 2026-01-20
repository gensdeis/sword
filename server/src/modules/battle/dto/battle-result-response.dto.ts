import { ApiProperty } from '@nestjs/swagger';

export class BattleResultResponseDto {
  @ApiProperty({ example: true, description: 'Whether the player won the battle' })
  isWin: boolean;

  @ApiProperty({ example: 12, description: 'Points earned (0 if lost)' })
  pointsEarned: number;

  @ApiProperty({ example: 700, description: 'Gold earned from battle' })
  goldEarned: number;

  @ApiProperty({ example: 1050, description: 'Total gold after battle' })
  totalGold: number;

  @ApiProperty({ example: 6, description: 'Current win streak' })
  currentStreak: number;

  @ApiProperty({ example: 5, description: 'Current ranking position' })
  ranking: number;

  @ApiProperty({ example: 1250, description: 'Total season points' })
  totalPoints: number;

  @ApiProperty({ example: 66.0, description: 'Win rate for this battle' })
  winRate: number;

  @ApiProperty({ example: 'OpponentName', description: 'Opponent username' })
  opponentName: string;

  @ApiProperty({ example: 5, description: 'Opponent weapon level' })
  opponentLevel: number;
}
