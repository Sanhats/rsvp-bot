import * as QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "../config/supabase"

export class QRService {
  public async generateQRForInvitation(invitationId: string): Promise<string> {
    const qrCode = uuidv4()
    const qrImageData = await QRCode.toDataURL(qrCode)

    const { error } = await supabase.from("checkin_codes").insert({
      invitation_id: invitationId,
      qr_code: qrCode,
      is_used: false,
    })

    if (error) {
      console.error("Error inserting QR code:", error)
      throw new Error("Failed to generate QR code")
    }

    return qrImageData
  }

  public async verifyQRCode(qrCode: string): Promise<boolean> {
    const { data, error } = await supabase.from("checkin_codes").select("*").eq("qr_code", qrCode).single()

    if (error) {
      console.error("Error verifying QR code:", error)
      return false
    }

    if (!data || data.is_used) {
      return false
    }

    // Mark QR code as used
    const { error: updateError } = await supabase
      .from("checkin_codes")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", data.id)

    if (updateError) {
      console.error("Error updating QR code status:", updateError)
      return false
    }

    return true
  }
}

export const qrService = new QRService()

