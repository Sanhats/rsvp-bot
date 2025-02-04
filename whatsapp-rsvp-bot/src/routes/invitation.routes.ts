import { Router } from "express"
import { InvitationController } from "../controllers/invitation.controller"

const router = Router()
const invitationController = new InvitationController()

router.post("/send", (req, res, next) => {
  invitationController.sendInvitation(req, res).catch(next)
})

router.post("/update-rsvp", (req, res, next) => {
  const { rsvpId, status } = req.body
  if (!rsvpId) {
    res.status(400).json({ error: "RSVP ID is required" })
    return
  }
  invitationController.updateRSVPStatus(req, res).catch(next)
})

export default router

