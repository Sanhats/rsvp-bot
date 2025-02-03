import { supabase } from '../config/supabase';
import { whatsappService } from './whatsapp';

interface Invitation {
  title: string;
  event_date: string;
  location: string;
}

interface RSVP {
  id: string;
  invitation_id: string;
  phone_number: string;
  guest_name: string;
  invitations: Invitation;
}

export class ReminderService {
  public async sendReminders(): Promise<void> {
    try {
      // Obtener invitaciones pendientes
      const { data: pendingRSVPs, error } = await supabase
        .from('rsvp_status')
        .select(`
          id,
          invitation_id,
          phone_number,
          guest_name,
          invitations (
            title,
            event_date,
            location
          )
        `)
        .eq('status', 'pending');

      if (error) {
        console.error('Error al obtener RSVPs pendientes:', error);
        return;
      }

      if (!pendingRSVPs) {
        console.log('No se encontraron RSVPs pendientes.');
        return;
      }

      for (const rsvp of pendingRSVPs as unknown as RSVP[]) {
        const message = `
¡Hola ${rsvp.guest_name}!

Te recordamos que has sido invitado/a a: ${rsvp.invitations.title}

Fecha: ${new Date(rsvp.invitations.event_date).toLocaleDateString()}
Lugar: ${rsvp.invitations.location}

Por favor, responde "Sí" para confirmar tu asistencia o "No" si no podrás asistir.

Si ya has respondido, por favor ignora este mensaje.
        `.trim();

        const sent = await whatsappService.sendMessage(rsvp.phone_number, message);

        if (sent) {
          // Registrar el envío del recordatorio
          await supabase
            .from('message_history')
            .insert({
              invitation_id: rsvp.invitation_id,
              phone_number: rsvp.phone_number,
              message_type: 'reminder',
              status: 'sent'
            });
        } else {
          console.error(`Error al enviar recordatorio a ${rsvp.phone_number}`);
        }
      }

      console.log(`Recordatorios enviados a ${pendingRSVPs.length} invitados.`);
    } catch (error) {
      console.error('Error al enviar recordatorios:', error);
    }
  }
}

export const reminderService = new ReminderService();