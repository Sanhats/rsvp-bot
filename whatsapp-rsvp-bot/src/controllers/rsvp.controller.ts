import type { Request, Response } from "express"
import { supabase } from "../config/supabase"

export class RSVPController {
  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("rsvp_status")
        .select("status")
        .in("status", ["confirmed", "declined", "pending"])

      if (error) {
        throw error
      }

      const stats = {
        confirmed: 0,
        declined: 0,
        pending: 0,
      }

      data.forEach((rsvp) => {
        stats[rsvp.status as keyof typeof stats]++
      })

      res.json(stats)
    } catch (error) {
      console.error("Error getting RSVP stats:", error)
      res.status(500).json({ error: "Error interno del servidor" })
    }
  }
}

