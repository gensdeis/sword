import { ApiProperty } from '@nestjs/swagger';
import { WeaponResponseDto } from '../../weapons/dto/weapon-response.dto';

export class KeepResponseDto {
  @ApiProperty({ description: 'User weapon that was added to inventory', type: () => WeaponResponseDto })
  userWeapon: WeaponResponseDto;

  @ApiProperty({ description: 'Whether this weapon was auto-equipped' })
  wasAutoEquipped: boolean;

  @ApiProperty({ description: 'Success message' })
  message: string;
}
