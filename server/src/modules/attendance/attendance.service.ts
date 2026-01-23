import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { AttendanceRecord, User } from '@/entities';
import { GAME_CONFIG } from '@/config/game-balance.config';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Check attendance for today
   */
  async checkAttendance(userId: number): Promise<{
    gold: number;
    consecutiveDays: number;
    checkedAt: Date;
  }> {
    // Check if already checked today
    const hasChecked = await this.hasCheckedToday(userId);
    if (hasChecked) {
      throw new BadRequestException('이미 오늘 출석했습니다');
    }

    // Get today's date (date only, not datetime)
    const today = this.getTodayDate();

    // Create attendance record
    const attendance = this.attendanceRepository.create({
      checkDate: today,
      rewardGold: GAME_CONFIG.ATTENDANCE.DAILY_GOLD,
    });
    attendance.userId = userId;

    const savedAttendance = await this.attendanceRepository.save(attendance);

    // Give gold reward to user
    await this.giveAttendanceReward(userId, GAME_CONFIG.ATTENDANCE.DAILY_GOLD);

    // Calculate consecutive days
    const consecutiveDays = await this.getConsecutiveDays(userId);

    return {
      gold: GAME_CONFIG.ATTENDANCE.DAILY_GOLD,
      consecutiveDays,
      checkedAt: savedAttendance.checkedAt,
    };
  }

  /**
   * Check if user has already checked today
   */
  async hasCheckedToday(userId: number): Promise<boolean> {
    const today = this.getTodayDate();

    const count = await this.attendanceRepository.count({
      where: {
        userId,
        checkDate: today,
      },
    });

    return count > 0;
  }

  /**
   * Get attendance history for recent days
   */
  async getAttendanceHistory(
    userId: number,
    days: number = 30,
  ): Promise<AttendanceRecord[]> {
    return await this.attendanceRepository.find({
      where: { userId },
      order: { checkDate: 'DESC' },
      take: days,
    });
  }

  /**
   * Calculate consecutive days count
   */
  async getConsecutiveDays(userId: number): Promise<number> {
    // Get all attendance records ordered by date DESC
    const records = await this.attendanceRepository.find({
      where: { userId },
      order: { checkDate: 'DESC' },
    });

    if (records.length === 0) {
      return 0;
    }

    let consecutiveDays = 1;
    const today = this.getTodayDate();

    // Start from the most recent record
    for (let i = 0; i < records.length - 1; i++) {
      const currentDate = new Date(records[i].checkDate);
      const nextDate = new Date(records[i + 1].checkDate);

      // Calculate difference in days
      const diffTime = currentDate.getTime() - nextDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      // If exactly 1 day difference, continue streak
      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        // Streak broken
        break;
      }
    }

    return consecutiveDays;
  }

  /**
   * Give attendance reward to user
   */
  async giveAttendanceReward(userId: number, gold: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    user.gold = Number(user.gold) + gold;
    await this.userRepository.save(user);
  }

  /**
   * Get today's date (date only, no time)
   */
  private getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
