import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private gmail;

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async fetchUnreadEmails(limit = 5) {
    try {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        q: 'is:unread',
        maxResults: limit,
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

          const bodyData = this.getMessageBody(payload);

          return {
            id: msg.id,
            from,
            subject,
            body: bodyData,
          };
        }),
      );

      return detailedMessages;
    } catch (err) {
      this.logger.error('Error fetching emails:', err);
      return [];
    }
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