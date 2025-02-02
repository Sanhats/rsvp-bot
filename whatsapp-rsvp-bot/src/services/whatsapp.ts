// src/services/whatsapp.ts
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { supabase } from '../config/supabase';

class WhatsAppService {
  private client: Client;
  private static instance: WhatsAppService;

  private constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox'],
      }
    });

    this.initialize();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  private initialize() {
    this.client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
    });

    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });

    this.client.initialize();
  }

  private async handleIncomingMessage(message: any) {
    try {
      const { body, from } = message;
      const phoneNumber = from.split('@')[0];

      // Buscar si existe un RSVP pendiente para este número
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvp_status')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('status', 'pending')
        .single();

      if (rsvpError) {
        console.error('Error checking RSVP status:', rsvpError);
        return;
      }

      if (rsvpData) {
        // Procesar respuesta
        const response = this.processResponse(body.toLowerCase());
        if (response) {
          await this.updateRSVPStatus(rsvpData.id, response);
          await message.reply(`Gracias por tu respuesta. Tu asistencia ha sido marcada como: ${response}`);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private processResponse(message: string): string | null {
    const confirmationKeywords = ['si', 'sí', 'confirmo', 'voy', 'asistiré', 'asistire'];
    const declineKeywords = ['no', 'declino', 'no puedo', 'no podré', 'no podre'];

    if (confirmationKeywords.some(keyword => message.includes(keyword))) {
      return 'confirmed';
    }
    if (declineKeywords.some(keyword => message.includes(keyword))) {
      return 'declined';
    }
    return null;
  }

  private async updateRSVPStatus(rsvpId: string, status: string) {
    const { error } = await supabase
      .from('rsvp_status')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', rsvpId);

    if (error) {
      console.error('Error updating RSVP status:', error);
      throw error;
    }
  }

  public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
      await this.client.sendMessage(chatId, message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
}

export const whatsappService = WhatsAppService.getInstance();