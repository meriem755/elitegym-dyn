import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// Programmes d'un membre
router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT pe.*, CONCAT(u.prenom, ' ', u.nom) as coach_nom
      FROM programme_entrainement pe
      JOIN coach c ON pe.id_coach = c.id_coach
      JOIN utilisateur u ON c.id_util = u.id_util
      WHERE pe.id_membre = ?
      ORDER BY pe.date_creation DESC
    `, [req.params.id_membre]);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Programmes créés par un coach
router.get("/coach/:id_coach", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT pe.*, CONCAT(u.prenom, ' ', u.nom) as membre_nom
      FROM programme_entrainement pe
      JOIN membre m ON pe.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE pe.id_coach = ?
      ORDER BY pe.date_creation DESC
    `, [req.params.id_coach]);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Créer un programme
router.post("/", authMiddleware, async (req, res) => {
  const { id_coach, id_membre, titre, description } = req.body;
  try {
    const [result]: any = await pool.query(`
      INSERT INTO programme_entrainement (id_coach, id_membre, titre, description, date_creation)
      VALUES (?, ?, ?, ?, CURDATE())
    `, [id_coach, id_membre, titre, description || ""]);
    res.json({ id_programme: result.insertId });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Supprimer un programme
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM programme_entrainement WHERE id_programme = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
