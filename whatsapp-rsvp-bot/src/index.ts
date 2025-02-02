// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import invitationRoutes from './routes/invitation.routes';
import { whatsappService } from './services/whatsapp';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Rutas
app.use('/api/invitations', invitationRoutes);

app.get('/', (req, res) => {
  res.send('WhatsApp RSVP Bot is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});