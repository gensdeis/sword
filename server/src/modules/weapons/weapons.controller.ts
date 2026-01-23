import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WeaponsService } from './weapons.service';
import { WeaponResponseDto } from './dto/weapon-response.dto';
import { SellResponseDto } from './dto/sell-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeaponTemplate } from '@/entities';

@ApiTags('weapons')
@Controller('weapons')
export class WeaponsController {
  constructor(private readonly weaponsService: WeaponsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my weapons' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of user weapons',
    type: [WeaponResponseDto],
  })
  async getMyWeapons(@Request() req): Promise<WeaponResponseDto[]> {
    return this.weaponsService.getMyWeapons(req.user.userId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all weapon templates' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all weapon templates',
    type: [WeaponTemplate],
  })
  async getWeaponTemplates(): Promise<WeaponTemplate[]> {
    return this.weaponsService.getWeaponTemplates();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get weapon details' })
  @ApiParam({ name: 'id', description: 'Weapon ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns weapon details',
    type: WeaponResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Weapon not found' })
  async getWeaponById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<WeaponResponseDto> {
    return this.weaponsService.getWeaponById(id, req.user.userId);
  }

  @Post(':id/equip')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Equip weapon' })
  @ApiParam({ name: 'id', description: 'Weapon ID' })
  @ApiResponse({
    status: 200,
    description: 'Weapon equipped successfully',
    type: WeaponResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Weapon not found' })
  @ApiResponse({ status: 400, description: 'Bad request (already equipped, destroyed, etc.)' })
  async equipWeapon(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<WeaponResponseDto> {
    return this.weaponsService.equipWeapon(id, req.user.userId);
  }

  @Post(':id/sell')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sell weapon' })
  @ApiParam({ name: 'id', description: 'Weapon ID' })
  @ApiResponse({
    status: 200,
    description: 'Weapon sold successfully',
    type: SellResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Weapon not found' })
  @ApiResponse({ status: 400, description: 'Bad request (equipped, already destroyed, etc.)' })
  async sellWeapon(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<SellResponseDto> {
    return this.weaponsService.sellWeapon(id, req.user.userId);
  }
}
