// src/controllers/invitation.controller.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { whatsappService } from '../services/whatsapp';

export class InvitationController {
  public async sendInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { invitationId, phoneNumber, guestName } = req.body;

      // Verificar si la invitación existe
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (invitationError || !invitation) {
        res.status(404).json({ error: 'Invitación no encontrada' });
        return;
      }

      const { data: rsvpData, error: rsvpError } = await supabase
  .from('rsvp_status')
  .insert({
    invitation_id: invitationId,
    phone_number: phoneNumber,
    guest_name: guestName,
    status: 'pending'
  });

if (rsvpError) {
  console.error('Error detallado al crear registro RSVP:', rsvpError);
  res.status(500).json({ error: 'Error creando registro RSVP', details: rsvpError });
  return;
}

      // Enviar mensaje por WhatsApp
      const message = `
¡Hola ${guestName}!

Has sido invitado/a a: ${invitation.title}

Fecha: ${new Date(invitation.event_date).toLocaleDateString()}
Lugar: ${invitation.location}

Por favor, responde "Sí" para confirmar tu asistencia o "No" si no podrás asistir.
      `.trim();

      const sent = await whatsappService.sendMessage(phoneNumber, message);

      if (!sent) {
        res.status(500).json({ error: 'Error enviando mensaje de WhatsApp' });
        return;
      }

      // Registrar el envío del mensaje
      await supabase
        .from('message_history')
        .insert({
          invitation_id: invitationId,
          phone_number: phoneNumber,
          message_type: 'invitation',
          status: 'sent'
        });

      res.json({ success: true, message: 'Invitación enviada correctamente' });
    } catch (error) {
      console.error('Error en sendInvitation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}