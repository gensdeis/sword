import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Mail, MailRewardType, User, UserWeapon } from '@/entities';
import { GAME_CONFIG } from '@/config/game-balance.config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(Mail)
    private mailRepository: Repository<Mail>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserWeapon)
    private userWeaponRepository: Repository<UserWeapon>,
  ) {}

  /**
   * Send a weapon reward via mail
   */
  async sendWeaponReward(
    userId: number,
    weaponTemplateId: number,
    title: string,
    content: string,
    expiresAt?: Date,
  ): Promise<Mail> {
    const mail = this.mailRepository.create({
      userId,
      title,
      content,
      rewardType: MailRewardType.WEAPON,
      rewardWeaponTemplateId: weaponTemplateId,
      rewardGold: 0,
      rewardStones: 0,
      expiresAt: expiresAt || this.getDefaultExpireDate(),
    });

    return await this.mailRepository.save(mail);
  }

  /**
   * Send gold reward via mail
   */
  async sendGoldReward(
    userId: number,
    gold: number,
    title: string,
    content: string,
    expiresAt?: Date,
  ): Promise<Mail> {
    const mail = this.mailRepository.create({
      userId,
      title,
      content,
      rewardType: MailRewardType.GOLD,
      rewardGold: gold,
      rewardStones: 0,
      expiresAt: expiresAt || this.getDefaultExpireDate(),
    });

    return await this.mailRepository.save(mail);
  }

  /**
   * Send multiple rewards via mail
   */
  async sendMultipleReward(
    userId: number,
    title: string,
    content: string,
    rewards: {
      gold?: number;
      stones?: number;
      weaponTemplateId?: number;
    },
    expiresAt?: Date,
  ): Promise<Mail> {
    const mail = this.mailRepository.create({
      userId,
      title,
      content,
      rewardType: MailRewardType.MULTIPLE,
      rewardWeaponTemplateId: rewards.weaponTemplateId || null,
      rewardGold: rewards.gold || 0,
      rewardStones: rewards.stones || 0,
      expiresAt: expiresAt || this.getDefaultExpireDate(),
    });

    return await this.mailRepository.save(mail);
  }

  /**
   * Get default expiration date (7 days from now)
   */
  private getDefaultExpireDate(): Date {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + GAME_CONFIG.MAIL.DEFAULT_EXPIRE_DAYS);
    return expireDate;
  }

  /**
   * Get next season end date for reward expiration
   */
  getNextSeasonEndDate(): Date {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    nextSunday.setHours(23, 59, 59, 999);
    return nextSunday;
  }

  /**
   * Get user's non-deleted and non-expired mails
   */
  async getMyMails(userId: number): Promise<Mail[]> {
    const now = new Date();
    return await this.mailRepository.find({
      where: {
        userId,
        isDeleted: false,
      },
      relations: ['rewardWeaponTemplate'],
      order: {
        createdAt: 'DESC',
      },
    }).then(mails => mails.filter(mail => mail.expiresAt > now));
  }

  /**
   * Send a new mail to user
   */
  async sendMail(
    userId: number,
    mailData: {
      title: string;
      content: string;
      rewardType: MailRewardType;
      rewardWeaponTemplateId?: number;
      rewardGold?: number;
      rewardStones?: number;
      expiresAt?: Date;
    },
  ): Promise<Mail> {
    const mail = this.mailRepository.create({
      userId,
      title: mailData.title,
      content: mailData.content,
      rewardType: mailData.rewardType,
      rewardWeaponTemplateId: mailData.rewardWeaponTemplateId || null,
      rewardGold: mailData.rewardGold || 0,
      rewardStones: mailData.rewardStones || 0,
      expiresAt: mailData.expiresAt || this.getDefaultExpireDate(),
    });

    return await this.mailRepository.save(mail);
  }

  /**
   * Claim mail rewards
   */
  async claimMail(
    mailId: number,
    userId: number,
  ): Promise<{
    goldReceived: number;
    stonesReceived: number;
    weaponReceived: number | null;
  }> {
    const mail = await this.mailRepository.findOne({
      where: { id: mailId, userId },
      relations: ['rewardWeaponTemplate'],
    });

    if (!mail) {
      throw new NotFoundException('메일을 찾을 수 없습니다');
    }

    if (mail.isDeleted) {
      throw new BadRequestException('삭제된 메일입니다');
    }

    if (mail.expiresAt < new Date()) {
      throw new BadRequestException('만료된 메일입니다');
    }

    if (mail.isClaimed) {
      throw new BadRequestException('이미 보상을 받은 메일입니다');
    }

    // Check weapon slot availability if weapon reward
    if (
      mail.rewardType === MailRewardType.WEAPON ||
      (mail.rewardType === MailRewardType.MULTIPLE && mail.rewardWeaponTemplateId)
    ) {
      const canClaim = await this.canClaimWeaponMail(userId);
      if (!canClaim) {
        throw new BadRequestException(
          '무기 슬롯이 부족합니다. 무기를 판매해주세요.',
        );
      }
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    let weaponReceived: number | null = null;

    // Give rewards based on type
    if (
      mail.rewardType === MailRewardType.WEAPON ||
      (mail.rewardType === MailRewardType.MULTIPLE && mail.rewardWeaponTemplateId)
    ) {
      // Create user weapon (not equipped)
      const userWeapon = this.userWeaponRepository.create({
        userId,
        weaponTemplateId: mail.rewardWeaponTemplateId!,
        enhancementLevel: 0,
        isEquipped: false,
        isDestroyed: false,
      });
      const savedWeapon = await this.userWeaponRepository.save(userWeapon);
      weaponReceived = Number(savedWeapon.id);
    }

    // Update user gold and stones
    if (mail.rewardGold > 0) {
      user.gold = Number(user.gold) + mail.rewardGold;
    }
    if (mail.rewardStones > 0) {
      user.enhancementStones += mail.rewardStones;
    }
    await this.userRepository.save(user);

    // Mark mail as claimed
    mail.isClaimed = true;
    await this.mailRepository.save(mail);

    return {
      goldReceived: mail.rewardGold,
      stonesReceived: mail.rewardStones,
      weaponReceived,
    };
  }

  /**
   * Delete a mail (only if claimed)
   */
  async deleteMail(mailId: number, userId: number): Promise<void> {
    const mail = await this.mailRepository.findOne({
      where: { id: mailId, userId },
    });

    if (!mail) {
      throw new NotFoundException('메일을 찾을 수 없습니다');
    }

    if (!mail.isClaimed) {
      throw new BadRequestException('보상을 먼저 받아야 삭제할 수 있습니다');
    }

    mail.isDeleted = true;
    await this.mailRepository.save(mail);
  }

  /**
   * Check if user can claim weapon mail (has available weapon slots)
   */
  async canClaimWeaponMail(userId: number): Promise<boolean> {
    const weaponCount = await this.userWeaponRepository.count({
      where: { userId, isDestroyed: false },
    });

    return weaponCount < GAME_CONFIG.WEAPON.MAX_SLOTS;
  }

  /**
   * Expire old mails (cron job runs daily at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldMails(): Promise<void> {
    const now = new Date();
    await this.mailRepository.update(
      {
        expiresAt: LessThan(now),
        isDeleted: false,
      },
      { isDeleted: true },
    );
  }

  /**
   * Create season reward mail for user
   */
  async createSeasonRewardMail(
    userId: number,
    weaponTemplateId: number,
    seasonId: number,
  ): Promise<Mail> {
    return await this.sendMail(userId, {
      title: `시즌 ${seasonId} 보상`,
      content: `축하합니다! 시즌 ${seasonId}에서 1위를 달성하여 전설 무기를 획득했습니다!`,
      rewardType: MailRewardType.WEAPON,
      rewardWeaponTemplateId: weaponTemplateId,
      expiresAt: this.getNextSeasonEndDate(),
    });
  }
}
