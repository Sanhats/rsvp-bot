// src/routes/invitation.routes.ts
import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';

const router = Router();
const invitationController = new InvitationController();

router.post('/send', (req, res) => invitationController.sendInvitation(req, res));

export default router;