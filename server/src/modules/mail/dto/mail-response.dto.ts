import { ApiProperty } from '@nestjs/swagger';
import { MailRewardType } from '@/entities';

export class MailResponseDto {
  @ApiProperty({ description: 'Mail ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Mail title', example: 'Season Reward' })
  title: string;

  @ApiProperty({
    description: 'Mail content',
    example: 'Congratulations! You ranked #1 in Season 1',
  })
  content: string;

  @ApiProperty({
    description: 'Reward type',
    enum: MailRewardType,
    example: MailRewardType.WEAPON,
  })
  rewardType: MailRewardType;

  @ApiProperty({
    description: 'Weapon template ID (if reward type is weapon)',
    example: 5,
    nullable: true,
  })
  rewardWeaponTemplateId: number | null;

  @ApiProperty({ description: 'Gold reward amount', example: 0 })
  rewardGold: number;

  @ApiProperty({ description: 'Stones reward amount', example: 0 })
  rewardStones: number;

  @ApiProperty({ description: 'Whether mail has been claimed', example: false })
  isClaimed: boolean;

  @ApiProperty({
    description: 'Mail expiration date',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Mail creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}
