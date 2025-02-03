import { Router } from "express"
import { RSVPController } from "../controllers/rsvp.controller"

const router = Router()
const rsvpController = new RSVPController()

router.get("/stats", (req, res) => rsvpController.getStats(req, res))

export default router

