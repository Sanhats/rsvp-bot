import { Client, LocalAuth, type Message } from "whatsapp-web.js"
// @ts-ignore
import qrcode from "qrcode-terminal"
import { supabase } from "../config/supabase"

class WhatsAppService {
  private client: Client
  private static instance: WhatsAppService

  private constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ["--no-sandbox"],
      },
    })

    this.initialize()
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  private initialize() {
    this.client.on("qr", (qr) => {
      console.log("QR RECEIVED", qr)
      qrcode.generate(qr, { small: true })
    })

    this.client.on("ready", () => {
      console.log("WhatsApp client is ready!")
    })

    this.client.on("message", async (message: Message) => {
      await this.handleIncomingMessage(message)
    })

    this.client.initialize()
  }

  private async handleIncomingMessage(message: Message) {
    try {
      const { body, from } = message
      const phoneNumber = from.split("@")[0]

      // Solo procesar el mensaje si es una respuesta válida
      const response = this.processResponse(body.toLowerCase())
      if (response === null) {
        // Si no es una respuesta válida, no hacemos nada
        return
      }

      // Buscar si existe un RSVP pendiente para este número
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvp_status")
        .select("*")
        .eq("phone_number", phoneNumber)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)

      if (rsvpError) {
        console.error("Error checking RSVP status:", rsvpError)
        return
      }

      if (rsvpData && rsvpData.length > 0) {
        const rsvp = rsvpData[0]
        // Actualizar el estado del RSVP
        const { error: updateError } = await supabase
          .from("rsvp_status")
          .update({ status: response, updated_at: new Date().toISOString() })
          .eq("id", rsvp.id)

        if (updateError) {
          console.error("Error updating RSVP status:", updateError)
          return
        }

        await message.reply(
          `Gracias por tu respuesta. Tu asistencia ha sido marcada como: ${response === "confirmed" ? "Confirmada" : "Declinada"}`,
        )
      }
      // Si no hay RSVP pendiente, no hacemos nada
    } catch (error) {
      console.error("Error handling message:", error)
    }
  }

  private processResponse(message: string): string | null {
    const confirmationKeywords = ["si", "sí", "confirmo", "voy", "asistiré", "asistire"]
    const declineKeywords = ["no", "declino", "no puedo", "no podré", "no podre"]

    if (confirmationKeywords.some((keyword) => message === keyword)) {
      return "confirmed"
    }
    if (declineKeywords.some((keyword) => message === keyword)) {
      return "declined"
    }
    return null
  }

  public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const chatId = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`
      await this.client.sendMessage(chatId, message)
      return true
    } catch (error) {
      console.error("Error sending message:", error)
      return false
    }
  }
}

export const whatsappService = WhatsAppService.getInstance()

