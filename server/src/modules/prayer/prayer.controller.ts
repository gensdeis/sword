import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrayerService } from './prayer.service';
import { PrayerResponseDto } from './dto/prayer-response.dto';
import { PrayerPoolStatsDto } from './dto/prayer-pool-stats.dto';

@ApiTags('Prayer')
@Controller('prayer')
export class PrayerController {
  constructor(private readonly prayerService: PrayerService) {}

  @Post('pray')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perform a prayer',
    description: 'User prays and contributes to the global prayer pool',
  })
  @ApiResponse({
    status: 200,
    description: 'Prayer performed successfully',
    type: PrayerResponseDto,
  })
  async pray(@Request() req: any): Promise<PrayerResponseDto> {
    // TODO: Get userId from authenticated request
    // const userId = req.user.id;
    const userId = 1; // Temporary placeholder

    return await this.prayerService.pray(userId);
  }

  @Get('pool')
  // @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get prayer pool statistics',
    description: 'Get current statistics of the global prayer pool (admin/debug)',
  })
  @ApiResponse({
    status: 200,
    description: 'Prayer pool statistics retrieved',
    type: PrayerPoolStatsDto,
  })
  async getPrayerPoolStats(): Promise<PrayerPoolStatsDto> {
    return await this.prayerService.getPrayerPoolStats();
  }
}
