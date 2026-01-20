import { ApiProperty } from '@nestjs/swagger';
import { WeaponTemplate } from '@/entities';

export class PullResponseDto {
  @ApiProperty({ description: 'Gacha session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Pulled weapon template', type: () => WeaponTemplate })
  weapon: WeaponTemplate;

  @ApiProperty({ description: 'Can reroll this pull' })
  canReroll: boolean;

  @ApiProperty({ description: 'Cost to reroll in gold (null if cannot reroll)' })
  rerollCost: number | null;

  @ApiProperty({ description: 'Current reroll count' })
  rerollCount: number;

  @ApiProperty({ description: 'Gold cost for this pull' })
  costGold: number;
}
