import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('unread')
  async getUnreadEmails(@Req() req: any) {
    
    const emails = await this.gmailService.fetchUnreadEmails();
    
    
  }
}
