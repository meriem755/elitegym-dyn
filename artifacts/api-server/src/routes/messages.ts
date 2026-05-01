import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/:id_util", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT n.*, u.nom, u.prenom
      FROM notification n
      JOIN utilisateur u ON n.id_util = u.id_util
      WHERE n.id_util = ?
      ORDER BY n.date_envoi DESC
      LIMIT 50
    `, [req.params.id_util]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { id_util, contenu, type_notif } = req.body;
  try {
    await pool.query(`
      INSERT INTO notification (id_util, type_notif, canal, contenu, statut)
      VALUES (?, ?, 'app', ?, 'envoye')
    `, [id_util, type_notif || 'message', contenu]);
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
