import { ApiProperty } from '@nestjs/swagger';

export class BattleRecordDto {
  @ApiProperty({ example: 1, description: 'Battle record ID' })
  id: number;

  @ApiProperty({ example: true, description: 'Whether the player won' })
  isWin: boolean;

  @ApiProperty({ example: 'OpponentName', description: 'Opponent username' })
  opponentName: string;

  @ApiProperty({ example: 5, description: 'My weapon level' })
  myWeaponLevel: number;

  @ApiProperty({ example: 4, description: 'Opponent weapon level' })
  opponentWeaponLevel: number;

  @ApiProperty({ example: 66.0, description: 'Win rate for this battle' })
  winRate: number;

  @ApiProperty({ example: 12, description: 'Points earned' })
  pointsEarned: number;

  @ApiProperty({ example: 700, description: 'Gold earned' })
  goldEarned: number;

  @ApiProperty({ example: 5, description: 'Win streak at the time' })
  streak: number;

  @ApiProperty({ example: '2026-01-14T10:30:00.000Z', description: 'Battle timestamp' })
  battleAt: Date;
}

export class BattleHistoryResponseDto {
  @ApiProperty({ type: [BattleRecordDto], description: 'List of battle records' })
  battles: BattleRecordDto[];

  @ApiProperty({ example: 50, description: 'Total number of battles' })
  total: number;

  @ApiProperty({ example: 35, description: 'Total wins' })
  totalWins: number;

  @ApiProperty({ example: 15, description: 'Total losses' })
  totalLosses: number;

  @ApiProperty({ example: 70.0, description: 'Win rate percentage' })
  winRate: number;
}
