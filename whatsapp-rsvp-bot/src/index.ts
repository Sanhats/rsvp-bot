import express from "express"
import dotenv from "dotenv"
import invitationRoutes from "./routes/invitation.routes"
import reminderRoutes from "./routes/reminder.routes"
import rsvpRoutes from "./routes/rsvp.routes"

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

// Rutas
app.use("/api/invitations", invitationRoutes)
app.use("/api/reminders", reminderRoutes)
app.use("/api/rsvp", rsvpRoutes)

app.get("/", (req, res) => {
  res.send("WhatsApp RSVP Bot is running!")
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

