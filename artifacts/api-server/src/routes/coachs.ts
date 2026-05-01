import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.id_coach, u.nom, u.prenom, u.telephone, c.specialite, c.date_embauche
      FROM coach c
      JOIN utilisateur u ON c.id_util = u.id_util
      WHERE u.statut = 1
    `);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/:id/membres", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT DISTINCT u.id_util, u.nom, u.prenom, u.telephone, m.id_membre, m.date_inscription
      FROM cours c
      JOIN reservation r ON c.id_cours = r.id_cours AND r.statut = 'confirmee'
      JOIN membre m ON r.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE c.id_coach = ?
    `, [req.params.id]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
