import { ApiProperty } from '@nestjs/swagger';

export class OpponentDto {
  @ApiProperty({ example: 12345, description: 'Opponent user ID' })
  userId: number;

  @ApiProperty({ example: 'OpponentName', description: 'Opponent username' })
  username: string;

  @ApiProperty({ example: 5, description: 'Opponent weapon level' })
  weaponLevel: number;

  @ApiProperty({ example: 'Legendary Sword', description: 'Opponent weapon name' })
  weaponName: string;

  @ApiProperty({ example: 'legendary', description: 'Opponent weapon rarity' })
  weaponRarity: string;

  @ApiProperty({ example: 66.0, description: 'Win rate percentage against this opponent' })
  winRate: number;
}

export class BattleEnterResponseDto {
  @ApiProperty({ example: 'match_abc123', description: 'Match ID for battle execution' })
  matchId: string;

  @ApiProperty({ type: OpponentDto, description: 'Matched opponent information' })
  opponent: OpponentDto;

  @ApiProperty({ example: 100, description: 'Entry fee paid' })
  entryFeePaid: number;

  @ApiProperty({ example: 900, description: 'Remaining gold after entry fee' })
  remainingGold: number;
}
