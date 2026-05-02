import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// Suivi d'un membre
router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT sp.*, CONCAT(u.prenom, ' ', u.nom) as coach_nom
      FROM suivi_performance sp
      JOIN coach c ON sp.id_coach = c.id_coach
      JOIN utilisateur u ON c.id_util = u.id_util
      WHERE sp.id_membre = ?
      ORDER BY sp.date_mesure DESC
    `, [req.params.id_membre]);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Suivi des membres d'un coach
router.get("/coach/:id_coach", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT sp.*, CONCAT(u.prenom, ' ', u.nom) as membre_nom
      FROM suivi_performance sp
      JOIN membre m ON sp.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE sp.id_coach = ?
      ORDER BY sp.date_mesure DESC
    `, [req.params.id_coach]);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Ajouter une mesure
router.post("/", authMiddleware, async (req, res) => {
  const { id_membre, id_coach, poids_kg, imc, tour_taille, observations } = req.body;
  try {
    const [result]: any = await pool.query(`
      INSERT INTO suivi_performance (id_membre, id_coach, date_mesure, poids_kg, imc, tour_taille, observations)
      VALUES (?, ?, CURDATE(), ?, ?, ?, ?)
    `, [id_membre, id_coach, poids_kg || null, imc || null, tour_taille || null, observations || null]);
    res.json({ id_suivi: result.insertId });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
