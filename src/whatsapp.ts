import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

class WhatsAppService {
  private client: Client;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
    });

  }

  public initializeClient() {
    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('✅ Client is ready!');
      this.isReady = true;
    });

    this.client.on('message', (msg) => {
      if (msg.body.toLowerCase() === 'hello') {
        msg.reply('Wahala for who no greet back 😂');
      }
    });

    this.client.initialize();
  }

  public async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('Client is not ready yet!');
    }
    await this.client.sendMessage(`${to}@c.us`, message);
  }

  public isClientReady(): boolean {
    return this.isReady;
  }
}

// Automatically initialize the service
const whatsappService = new WhatsAppService();

// Export reusable methods
export const sendMessage = async (
  to: string,
  message: string,
): Promise<void> => {
  await whatsappService.sendMessage(to, message);
};

export const isClientReady = (): boolean => {
  return whatsappService.isClientReady();
};

// Export the service for advanced use if needed
export default whatsappService;
