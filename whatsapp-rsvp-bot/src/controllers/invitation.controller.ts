import type { Request, Response } from "express"
import { supabase } from "../config/supabase"
import { whatsappService } from "../services/whatsapp"
import { QRService } from "../services/qr.service"

export class InvitationController {
  private qrService: QRService

  constructor() {
    this.qrService = new QRService()
  }

  public async sendInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { invitationId, phoneNumber, guestName } = req.body

      // Verificar si la invitación existe
      const { data: invitation, error: invitationError } = await supabase
        .from("invitations")
        .select("*")
        .eq("id", invitationId)
        .single()

      if (invitationError) {
        console.error("Error fetching invitation:", invitationError)
        res.status(404).json({ error: "Invitación no encontrada" })
        return
      }

      if (!invitation) {
        res.status(404).json({ error: "Invitación no encontrada" })
        return
      }

      // Crear registro RSVP
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvp_status")
        .insert({
          invitation_id: invitationId,
          phone_number: phoneNumber,
          guest_name: guestName,
          status: "pending",
        })
        .select()
        .single()

      if (rsvpError) {
        console.error("Error creating RSVP:", rsvpError)
        res.status(500).json({ error: "Error creando registro RSVP" })
        return
      }

      // Enviar mensaje por WhatsApp
      const message = `
¡Hola ${guestName}!

Has sido invitado/a a: ${invitation.title}

Fecha: ${new Date(invitation.event_date).toLocaleDateString()}
Lugar: ${invitation.location}

Por favor, responde "Sí" para confirmar tu asistencia o "No" si no podrás asistir.
      `.trim()

      const sent = await whatsappService.sendMessage(phoneNumber, message)

      if (!sent) {
        console.error("Error sending WhatsApp message")
        res.status(500).json({ error: "Error enviando mensaje de WhatsApp" })
        return
      }

      // Registrar el envío del mensaje
      const { error: messageHistoryError } = await supabase.from("message_history").insert({
        invitation_id: invitationId,
        phone_number: phoneNumber,
        message_type: "invitation",
        status: "sent",
      })

      if (messageHistoryError) {
        console.error("Error registering message history:", messageHistoryError)
      }

      res.json({ success: true, message: "Invitación enviada correctamente" })
    } catch (error) {
      console.error("Error en sendInvitation:", error)
      res.status(500).json({ error: "Error interno del servidor" })
    }
  }

  public async updateRSVPStatus(req: Request, res: Response): Promise<void> {
    try {
      const { rsvpId, status } = req.body

      if (!rsvpId) {
        console.error("RSVP ID is missing")
        res.status(400).json({ error: "RSVP ID is required" })
        return
      }

      console.log("Updating RSVP status:", { rsvpId, status })

      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvp_status")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", rsvpId)
        .select()
        .single()

      if (rsvpError) {
        console.error("Error updating RSVP status:", rsvpError)
        res.status(500).json({ error: "Error actualizando estado RSVP", details: rsvpError })
        return
      }

      if (!rsvpData) {
        console.error("RSVP not found:", rsvpId)
        res.status(404).json({ error: "RSVP no encontrado" })
        return
      }

      console.log("RSVP updated successfully:", rsvpData)

      if (status === "confirmed") {
        // Generar y enviar código QR
        try {
          const qrImageData = await this.qrService.generateQRForInvitation(rsvpData.invitation_id)
          const qrMessage = `
Gracias por confirmar tu asistencia. Aquí tienes tu código QR para el check-in:

${qrImageData}

Por favor, muestra este código al llegar al evento.
          `.trim()

          const sent = await whatsappService.sendMessage(rsvpData.phone_number, qrMessage)

          if (!sent) {
            console.error("Error sending QR code via WhatsApp")
          } else {
            console.log("QR code sent successfully")
          }
        } catch (qrError) {
          console.error("Error generating or sending QR code:", qrError)
        }
      }

      res.json({ success: true, message: "Estado RSVP actualizado correctamente" })
    } catch (error) {
      console.error("Error en updateRSVPStatus:", error)
      res.status(500).json({ error: "Error interno del servidor" })
    }
  }
}

