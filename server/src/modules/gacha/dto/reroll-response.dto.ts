import { ApiProperty } from '@nestjs/swagger';
import { WeaponTemplate } from '@/entities';

export class RerollResponseDto {
  @ApiProperty({ description: 'Gacha session ID' })
  sessionId: string;

  @ApiProperty({ description: 'New weapon template after reroll', type: () => WeaponTemplate })
  weapon: WeaponTemplate;

  @ApiProperty({ description: 'Can reroll again' })
  canReroll: boolean;

  @ApiProperty({ description: 'Cost to reroll next time (null if cannot reroll)' })
  rerollCost: number | null;

  @ApiProperty({ description: 'Current reroll count' })
  rerollCount: number;

  @ApiProperty({ description: 'Gold spent on this reroll' })
  goldSpent: number;
}
