import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// GET /paiements/membre/:id_membre
router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, f.nom as formule_nom
      FROM paiement p
      LEFT JOIN abonnement a ON p.id_abonnement = a.id_abonnement
      LEFT JOIN formule_abonnement f ON a.id_formule = f.id_formule
      WHERE p.id_membre = ?
      ORDER BY p.date_heure DESC
    `, [req.params.id_membre]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
