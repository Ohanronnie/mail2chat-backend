import { Controller, Get } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('unread')
  async getUnreadEmails() {
    console.log("request here")
    const emails = await this.gmailService.fetchUnreadEmails();
    return { count: emails.length, emails };
  }
}
