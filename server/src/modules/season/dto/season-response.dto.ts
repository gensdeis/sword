import { ApiProperty } from '@nestjs/swagger';
import { SeasonStatus } from '../../../entities/season.entity';

export class SeasonResponseDto {
  @ApiProperty({ example: 1, description: 'Season ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Season number' })
  seasonNumber: number;

  @ApiProperty({ example: '2026-01-13T08:00:00.000Z', description: 'Season start time' })
  startAt: Date;

  @ApiProperty({ example: '2026-01-19T23:59:59.000Z', description: 'Season end time' })
  endAt: Date;

  @ApiProperty({
    enum: SeasonStatus,
    example: SeasonStatus.ACTIVE,
    description: 'Season status (upcoming, active, settling, completed)'
  })
  status: SeasonStatus;

  @ApiProperty({ example: 101, description: 'Reward weapon template ID', required: false })
  rewardWeaponTemplateId?: number;

  @ApiProperty({ example: false, description: 'Whether currently in settlement period' })
  isInSettlement: boolean;
}
