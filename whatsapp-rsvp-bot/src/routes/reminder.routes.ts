import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller';

const router = Router();
const reminderController = new ReminderController();

router.post('/send', (req, res) => reminderController.sendReminders(req, res));

export default router;