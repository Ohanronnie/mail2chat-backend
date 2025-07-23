import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { onTextReceived } from './custom-module';

class WhatsAppService {
  private client: Client;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
      },
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
    this.client.on('message', onTextReceived);
    console.log("here xyz")
    this.client.initialize();
  }

  public async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('Client is not ready yet!');
    }
    const normalized = to.replace(/^\+/, '');
    console.log(normalized);
    await this.client.sendMessage(`${normalized}@c.us`, message);
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
