import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MailService } from './mail.service';
import { MailResponseDto } from './dto/mail-response.dto';
import { ClaimResponseDto } from './dto/claim-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mails')
@Controller('mails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @ApiOperation({ summary: 'Get my mails' })
  @ApiResponse({
    status: 200,
    description: 'List of non-deleted and non-expired mails',
    type: [MailResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMails(@Request() req): Promise<MailResponseDto[]> {
    const mails = await this.mailService.getMyMails(req.user.userId);
    return mails.map((mail) => ({
      id: Number(mail.id),
      title: mail.title,
      content: mail.content,
      rewardType: mail.rewardType,
      rewardWeaponTemplateId: mail.rewardWeaponTemplateId,
      rewardGold: mail.rewardGold,
      rewardStones: mail.rewardStones,
      isClaimed: mail.isClaimed,
      expiresAt: mail.expiresAt,
      createdAt: mail.createdAt,
    }));
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim mail rewards' })
  @ApiParam({ name: 'id', description: 'Mail ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Mail rewards claimed successfully',
    type: ClaimResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Already claimed, expired, or no weapon slots' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mail not found' })
  async claimMail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ClaimResponseDto> {
    const result = await this.mailService.claimMail(id, req.user.userId);

    let message = '메일 보상을 받았습니다';
    if (result.weaponReceived) {
      message += ` (무기 획득)`;
    }
    if (result.goldReceived > 0) {
      message += ` (골드 +${result.goldReceived})`;
    }
    if (result.stonesReceived > 0) {
      message += ` (강화석 +${result.stonesReceived})`;
    }

    return {
      goldReceived: result.goldReceived,
      stonesReceived: result.stonesReceived,
      weaponReceived: result.weaponReceived,
      message,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete claimed mail' })
  @ApiParam({ name: 'id', description: 'Mail ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Mail deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Mail not claimed yet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mail not found' })
  async deleteMail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.mailService.deleteMail(id, req.user.userId);
    return { message: '메일이 삭제되었습니다' };
  }
}
