import { Request, Response } from 'express';
import { reminderService } from '../services/reminder.service';

export class ReminderController {
  public async sendReminders(req: Request, res: Response): Promise<void> {
    try {
      await reminderService.sendReminders();
      res.json({ success: true, message: 'Recordatorios enviados exitosamente' });
    } catch (error) {
      console.error('Error al enviar recordatorios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}