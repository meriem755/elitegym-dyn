import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/membres", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT u.id_util, u.nom, u.prenom, u.telephone, u.email, u.date_creation, m.id_membre, m.date_inscription
      FROM membre m
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE u.statut = 1
    `);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/coachs", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT u.id_util, u.nom, u.prenom, u.telephone, u.email, c.id_coach, c.specialite, c.date_embauche
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

router.get("/paiements", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, u.nom, u.prenom, f.nom as formule_nom
      FROM paiement p
      JOIN membre m ON p.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      LEFT JOIN abonnement a ON p.id_abonnement = a.id_abonnement
      LEFT JOIN formule_abonnement f ON a.id_formule = f.id_formule
      ORDER BY p.date_heure DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/audit", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT j.*, u.nom, u.prenom
      FROM journal_audit j
      JOIN utilisateur u ON j.id_util = u.id_util
      ORDER BY j.date_action DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/membres", authMiddleware, async (req, res) => {
  const { nom, prenom, telephone, email, mot_de_passe } = req.body;
  try {
    const hash = await bcrypt.hash(mot_de_passe || "elitegym2026", 12);
    const [result]: any = await pool.query(`
      INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role) VALUES (?, ?, ?, ?, ?, 'membre')
    `, [nom, prenom, email || `${telephone}@elitegym.dz`, hash, telephone]);
    await pool.query(
      "INSERT INTO membre (id_util, date_inscription) VALUES (?, CURDATE())",
      [result.insertId]
    );
    res.json({ success: true, id_util: result.insertId });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur (téléphone ou email déjà utilisé)" });
  }
});

router.post("/coachs", authMiddleware, async (req, res) => {
  const { nom, prenom, telephone, email, specialite, mot_de_passe } = req.body;
  try {
    const hash = await bcrypt.hash(mot_de_passe || "elitegym2026", 12);
    const [result]: any = await pool.query(`
      INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role) VALUES (?, ?, ?, ?, ?, 'coach')
    `, [nom, prenom, email || `${telephone}@elitegym.dz`, hash, telephone]);
    await pool.query(
      "INSERT INTO coach (id_util, specialite, date_embauche) VALUES (?, ?, CURDATE())",
      [result.insertId, specialite]
    );
    res.json({ success: true, id_util: result.insertId });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur (téléphone ou email déjà utilisé)" });
  }
});

export default router;
