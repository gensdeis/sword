import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import {
  AttendanceHistoryResponseDto,
  AttendanceHistoryItemDto,
} from './dto/attendance-history-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check')
  @ApiOperation({ summary: 'Daily check-in' })
  @ApiResponse({
    status: 201,
    description: 'Attendance checked successfully',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Already checked today' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkAttendance(@Request() req): Promise<AttendanceResponseDto> {
    const result = await this.attendanceService.checkAttendance(req.user.userId);

    return {
      gold: result.gold,
      consecutiveDays: result.consecutiveDays,
      checkedAt: result.checkedAt,
      message: `출석 완료! ${result.gold} 골드를 받았습니다. (연속 ${result.consecutiveDays}일)`,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get attendance history' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of recent days to fetch (default: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance history retrieved successfully',
    type: AttendanceHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAttendanceHistory(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ): Promise<AttendanceHistoryResponseDto> {
    const records = await this.attendanceService.getAttendanceHistory(
      req.user.userId,
      days || 30,
    );

    const consecutiveDays = await this.attendanceService.getConsecutiveDays(
      req.user.userId,
    );

    return {
      total: records.length,
      consecutiveDays,
      records: records.map((record) => ({
        checkDate: record.checkDate,
        rewardGold: record.rewardGold,
        checkedAt: record.checkedAt,
      })),
    };
  }

  @Get('consecutive')
  @ApiOperation({ summary: 'Get consecutive days count' })
  @ApiResponse({
    status: 200,
    description: 'Consecutive days count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        consecutiveDays: {
          type: 'number',
          example: 5,
          description: 'Number of consecutive check-in days',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConsecutiveDays(
    @Request() req,
  ): Promise<{ consecutiveDays: number }> {
    const consecutiveDays = await this.attendanceService.getConsecutiveDays(
      req.user.userId,
    );

    return { consecutiveDays };
  }
}
