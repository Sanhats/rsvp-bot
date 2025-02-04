import type { Request, Response } from "express"
import { QRService } from "../services/qr.service"

export class QRController {
  private qrService: QRService

  constructor() {
    this.qrService = new QRService()
  }

  public async generateQR(req: Request, res: Response): Promise<void> {
    try {
      const { invitationId } = req.params
      const qrImageData = await this.qrService.generateQRForInvitation(invitationId)
      res.json({ qrImageData })
    } catch (error) {
      console.error("Error generating QR code:", error)
      res.status(500).json({ error: "Error interno del servidor" })
    }
  }

  public async verifyQR(req: Request, res: Response): Promise<void> {
    try {
      const { qrCode } = req.body
      const isValid = await this.qrService.verifyQRCode(qrCode)
      res.json({ isValid })
    } catch (error) {
      console.error("Error verifying QR code:", error)
      res.status(500).json({ error: "Error interno del servidor" })
    }
  }
}

