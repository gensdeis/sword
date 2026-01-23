import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { AttendanceService } from '../attendance/attendance.service';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AttendanceService))
    private readonly attendanceService: AttendanceService,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, username, password } = createUserDto;

    // Check if user already exists
    const existingUserByEmail = await this.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUserByUsername = await this.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate random seed salt using uuid
    const seedSalt = uuidv4();

    // Create user
    const user = this.userRepository.create({
      email,
      username,
      passwordHash,
      seedSalt,
      gold: 1000, // Default starting gold
      enhancementStones: 0, // Default starting stones
    });

    return this.userRepository.save(user);
  }

  async updateGold(userId: number, amount: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.gold = Number(user.gold) + amount;
    return this.userRepository.save(user);
  }

  async updateStones(userId: number, amount: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.enhancementStones += amount;
    return this.userRepository.save(user);
  }

  async getProfile(userId: number): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const consecutiveAttendanceDays = await this.attendanceService.getConsecutiveDays(userId);
    const attendanceHistory = await this.attendanceService.getAttendanceHistory(userId, 1);
    const lastAttendanceDate = attendanceHistory.length > 0 ? attendanceHistory[0].checkDate : null;

    return new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      gold: user.gold,
      enhancementStones: user.enhancementStones,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      consecutiveAttendanceDays,
      lastAttendanceDate,
    });
  }
}
