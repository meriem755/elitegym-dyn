import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT r.*, c.type_cours, c.date_cours, c.heure_debut, c.duree_minutes, c.salle,
             u.nom, u.prenom
      FROM reservation r
      JOIN cours c ON r.id_cours = c.id_cours
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE r.id_membre = ?
      ORDER BY c.date_cours DESC, c.heure_debut DESC
    `, [req.params.id_membre]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { id_membre, id_cours } = req.body;
  try {
    const [cours]: any = await pool.query("SELECT * FROM cours WHERE id_cours = ? AND statut = 'publie'", [id_cours]);
    if (!cours.length) return res.status(404).json({ error: "Cours non trouvé" });
    if (cours[0].places_restantes <= 0) return res.status(400).json({ error: "Plus de places disponibles" });

    const [existing]: any = await pool.query(
      "SELECT * FROM reservation WHERE id_membre = ? AND id_cours = ?",
      [id_membre, id_cours]
    );
    if (existing.length) return res.status(400).json({ error: "Déjà inscrit à ce cours" });

    await pool.query(
      "INSERT INTO reservation (id_membre, id_cours, statut) VALUES (?, ?, 'confirmee')",
      [id_membre, id_cours]
    );
    await pool.query(
      "UPDATE cours SET places_restantes = places_restantes - 1 WHERE id_cours = ?",
      [id_cours]
    );
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id/annuler", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT r.*, c.date_cours, c.heure_debut
      FROM reservation r
      JOIN cours c ON r.id_cours = c.id_cours
      WHERE r.id_reservation = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: "Réservation non trouvée" });

    const res_ = rows[0];
    const coursDate = new Date(`${res_.date_cours}T${res_.heure_debut}`);
    const now = new Date();
    const diff = coursDate.getTime() - now.getTime();
    const hours48 = 48 * 60 * 60 * 1000;

    if (diff < hours48) return res.status(400).json({ error: "Annulation impossible (délai de 48h dépassé)" });

    await pool.query("UPDATE reservation SET statut = 'annulee' WHERE id_reservation = ?", [req.params.id]);
    await pool.query("UPDATE cours SET places_restantes = places_restantes + 1 WHERE id_cours = ?", [res_.id_cours]);
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
