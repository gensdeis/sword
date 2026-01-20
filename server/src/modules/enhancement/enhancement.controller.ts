import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnhancementService } from './enhancement.service';
import { EnhanceResponseDto } from './dto/enhance-response.dto';
import { EnhancementHistoryResponseDto } from './dto/enhancement-history-response.dto';

@ApiTags('Enhancement')
@Controller()
export class EnhancementController {
  constructor(private readonly enhancementService: EnhancementService) {}

  @Post('weapons/:id/enhance')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enhance a weapon',
    description:
      'Attempts to enhance a weapon. Consumes a prayer effect from the global pool and applies it to enhancement rates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Weapon ID to enhance',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Enhancement attempted',
    type: EnhanceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Weapon not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot enhance (destroyed or max level)',
  })
  async enhanceWeapon(
    @Param('id', ParseIntPipe) weaponId: number,
    @Request() req: any,
  ): Promise<EnhanceResponseDto> {
    // TODO: Get userId from authenticated request
    // const userId = req.user.id;
    const userId = 1; // Temporary placeholder

    const result = await this.enhancementService.enhanceWeapon(userId, weaponId);

    return {
      result: result.result,
      newLevel: result.newLevel,
      levelIncrease: result.levelIncrease,
      weapon: result.weapon,
      successRate: result.successRate,
      destructionRate: result.destructionRate,
      prayerEffect: result.prayerEffect,
    };
  }

  @Get('enhancement/history')
  // @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get enhancement history',
    description: 'Get the authenticated user\'s enhancement history',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of records to return',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Enhancement history retrieved',
    type: EnhancementHistoryResponseDto,
  })
  async getEnhancementHistory(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<EnhancementHistoryResponseDto> {
    // TODO: Get userId from authenticated request
    // const userId = req.user.id;
    const userId = 1; // Temporary placeholder

    const result = await this.enhancementService.getEnhancementHistory(
      userId,
      limit || 50,
    );

    return {
      history: result.history.map((item) => ({
        id: item.id,
        userWeaponId: item.userWeaponId,
        fromLevel: item.fromLevel,
        toLevel: item.toLevel,
        result: item.result,
        successRate: Number(item.successRate),
        destructionRate: Number(item.destructionRate),
        prayerEffect: item.prayerEffect,
        enhancedAt: item.enhancedAt,
      })),
      total: result.total,
    };
  }
}
