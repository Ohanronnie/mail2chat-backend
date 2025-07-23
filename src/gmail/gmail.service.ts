import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/auth/schemas/user.schema';
import { Model } from 'mongoose';
import * as cheerio from 'cheerio';
import { sendMessage } from 'src/whatsapp';

function extraClean(text: string) {
  return text
    .replace(/[\u0000-\u001F\u034F\u200B\u200C\u200D\u2060\uFEFF]/g, '') // Control + invisible chars
    .replace(/\s{2,}/g, ' ')
    .trim();
}
@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private gmail;

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async fetchUnreadEmails(limit = 5) {
    const users = await this.userModel.find({ isPhoneVerified: true });
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      );
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });
      try {
        const afterTime = user.lastEmailFetched
          ? new Date(user.lastEmailFetched).getTime() / 1000
          : new Date('2024-04-04').getTime() / 1000;
        const res = await this.gmail.users.messages.list({
          userId: 'me',
          labelIds: ['INBOX'],
          q: `is:unread after:${afterTime}`,
          maxResults: 2,
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) {
          this.logger.log('No unread messages');
          return [];
        }

        const detailedMessages = await Promise.all(
          messages.map(async (msg) => {
            const detail = await this.gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
            });

            const payload = detail.data.payload;
            const headers = payload.headers;
            const subject = headers.find((h) => h.name === 'Subject')?.value;
            const from = headers.find((h) => h.name === 'From')?.value;
            const date = headers.find((h) => h.name === 'Date')?.value;
            const bodyData = this.extractMessageBody(payload);
            let body: string = '';
            if (bodyData.html || bodyData.plain) {
              const $ = cheerio.load(bodyData.html || bodyData.plain);
              $('script, footer, style, noscript, iframe, link').remove();
              body = $('body').text().replaceAll(/\s+/g, ' ').trim();
            }

            const BodyText = `
✨ *New Mail Alert!* ✨
            
📬 Hey Boss! You've got an exciting new message!
            
👤 *From*: ${from}
📝 *Subject*: ${subject}
🕒 *Received*: ${date}
📋 *Message*:  
${extraClean(body)}
----------------------
Powered by MailBridge 🌉`;
            sendMessage(user.phoneNumber, BodyText);
            await this.userModel.updateOne({ lastEmailFetched: new Date() });
          }),
        );

        return detailedMessages;
      } catch (err) {
        this.logger.error('Error fetching emails:', err);
        return [];
      }
    }
  }
  private extractMessageBody(payload: any) {
    let plain = '';
    let html = '';

    function traverseParts(parts: any[] = []) {
      for (const part of parts) {
        const mime = part.mimeType;

        if (mime === 'text/plain' && part.body?.data) {
          const decoded = Buffer.from(part.body.data, 'base64').toString(
            'utf-8',
          );
          plain += decoded;
        }

        if (mime === 'text/html' && part.body?.data) {
          const decoded = Buffer.from(part.body.data, 'base64').toString(
            'utf-8',
          );
          html += decoded;
        }

        // Go deeper if it has sub-parts
        if (part.parts?.length) {
          traverseParts(part.parts);
        }
      }
    }

    // Top level body might be plain too
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      plain += Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.mimeType === 'text/html' && payload.body?.data) {
      html += Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts?.length) {
      traverseParts(payload.parts);
    }

    return { plain, html };
  }

  private getMessageBody(payload: any): string {
    let body = '';

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
    } else if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return body.trim();
  }
}
