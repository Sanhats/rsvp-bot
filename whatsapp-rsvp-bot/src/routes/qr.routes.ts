import { Router } from "express"
import { QRController } from "../controllers/qr.controller"

const router = Router()
const qrController = new QRController()

router.get("/generate/:invitationId", (req, res) => qrController.generateQR(req, res))
router.post("/verify", (req, res) => qrController.verifyQR(req, res))

export default router

