import WAWebJS, { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
@Injectable()
export class BotService implements OnModuleInit {
  constructor(private eventEmitter: EventEmitter2) {}
  private client: Client = new Client({
    authStrategy: new LocalAuth(),
  });
  private clientReady: boolean = false;
  private readonly logger = new Logger(BotService.name);
  onModuleInit() {
    this.client.on('qr', (qr) => {
      this.logger.log(`Qr code: ${qr}`);
      this.eventEmitter.emit("qrcode.created", qr);
      qrcode.generate(qr, { small: true });
      
    });

    this.client.on('ready', () => {
      this.logger.log('Client is ready');
      this.clientReady = true;
    });

    this.client.on('message', (msg: WAWebJS.Message) => {
      this.eventEmitter.emit('chat.message', msg);
    });
    this.client.initialize();
  }
  public async sendMessage(to: string, message: string): Promise<void> {
    if (!this.clientReady) {
      throw new Error('Client is not ready yet!');
    }
    const normalized = to.replace(/^\+/, '');
    console.log(normalized);
    await this.client.sendMessage(`${normalized}@c.us`, message);
  }
  @OnEvent('user.token.send')
  async handleSendToken(payload: { phone: string; message: string }) {
    this.logger.log('Sending otp to ' + payload.phone);
    this.sendMessage(payload.phone, payload.message);
  }
  @OnEvent('mail.send')
  async handleMail(payload: { phone: string; message: string }) {
    this.logger.log('Sending mail to ' + payload.phone);
    this.sendMessage(payload.phone, payload.message);
  }
}
