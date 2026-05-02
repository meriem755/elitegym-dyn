import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.nom, u.prenom, co.specialite
      FROM cours c JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE c.statut = 'publie' ORDER BY c.date_cours, c.heure_debut
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/week", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.nom, u.prenom, co.specialite
      FROM cours c JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE c.statut = 'publie'
        AND c.date_cours BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
      ORDER BY c.date_cours, c.heure_debut
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/coach/:id_coach", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.nom, u.prenom
      FROM cours c JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE c.id_coach = ? ORDER BY c.date_cours DESC, c.heure_debut
    `, [req.params.id_coach]);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Coach soumet un cours → statut 'en_attente' (nécessite approbation admin)
router.post("/", authMiddleware, async (req, res) => {
  const { id_coach, type_cours, date_cours, heure_debut, duree_minutes, salle, capacite_max } = req.body;
  try {
    const [result]: any = await pool.query(`
      INSERT INTO cours (id_coach, type_cours, date_cours, heure_debut, duree_minutes, salle, capacite_max, places_restantes, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
    `, [id_coach, type_cours, date_cours, heure_debut, duree_minutes || 60, salle, capacite_max || 20, capacite_max || 20]);
    res.json({ id_cours: result.insertId });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/annuler", authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE cours SET statut = 'annule' WHERE id_cours = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
