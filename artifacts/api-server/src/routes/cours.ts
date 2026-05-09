import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// Tous les cours publiés avec places_restantes calculé dynamiquement
router.get("/", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.*,
        u.nom, u.prenom, co.specialite,
        (c.capacite_max - COUNT(CASE WHEN r.statut = 'confirmee' THEN 1 END)) AS places_restantes
      FROM cours c 
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      LEFT JOIN reservation r ON r.id_cours = c.id_cours
      WHERE c.statut = 'publie'
      GROUP BY c.id_cours, u.nom, u.prenom, co.specialite
      ORDER BY c.date_cours, c.heure_debut
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Cours de la semaine actuelle avec places_restantes calculé dynamiquement
router.get("/week", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.*,
        u.nom, u.prenom, co.specialite,
        (c.capacite_max - COUNT(CASE WHEN r.statut = 'confirmee' THEN 1 END)) AS places_restantes
      FROM cours c 
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      LEFT JOIN reservation r ON r.id_cours = c.id_cours
      WHERE c.statut = 'publie'
        AND c.date_cours BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
      GROUP BY c.id_cours, u.nom, u.prenom, co.specialite
      ORDER BY c.date_cours, c.heure_debut
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Cours d'un coach avec places_restantes calculé dynamiquement
router.get("/coach/:id_coach", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.*,
        u.nom, u.prenom,
        (c.capacite_max - COUNT(CASE WHEN r.statut = 'confirmee' THEN 1 END)) AS places_restantes
      FROM cours c 
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      LEFT JOIN reservation r ON r.id_cours = c.id_cours
      WHERE c.id_coach = ?
      GROUP BY c.id_cours, u.nom, u.prenom
      ORDER BY c.date_cours DESC, c.heure_debut
    `, [req.params.id_coach]);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Cours en attente d'approbation (pour admin)
router.get("/en-attente", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.nom, u.prenom
      FROM cours c
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE c.statut = 'en_attente'
      ORDER BY c.date_cours, c.heure_debut
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Coach soumet un cours → statut 'en_attente'
router.post("/", authMiddleware, async (req, res) => {
  const { id_coach, type_cours, date_cours, heure_debut, duree_minutes, salle, capacite_max } = req.body;
  try {
    const cap = Number(capacite_max) || 20;
    const [result]: any = await pool.query(`
      INSERT INTO cours (id_coach, type_cours, date_cours, heure_debut, duree_minutes, salle, capacite_max, places_restantes, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
    `, [id_coach, type_cours, date_cours, heure_debut, duree_minutes || 60, salle, cap, cap]);
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