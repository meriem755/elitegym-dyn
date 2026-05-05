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

// Historique de présence (cours passés confirmés) + stats pour un membre
router.get("/presence/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        r.id_reservation, c.id_cours,
        r.statut,
        r.date_reservation,
        c.type_cours,
        c.date_cours,
        c.heure_debut,
        c.duree_minutes,
        c.salle,
        CONCAT(u.prenom, ' ', u.nom) AS coach_nom
      FROM reservation r
      JOIN cours c ON r.id_cours = c.id_cours
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE r.id_membre = ?
        AND r.statut = 'confirmee'
        AND c.date_cours <= CURDATE()
      ORDER BY c.date_cours DESC, c.heure_debut DESC
    `, [req.params.id_membre]);

    // Stats globales
    const total_seances = rows.length;
    const total_minutes = rows.reduce((acc: number, r: any) => acc + (r.duree_minutes || 0), 0);
    const total_heures = Math.round(total_minutes / 60 * 10) / 10;

    // Cours le plus pratiqué
    const compteur: Record<string, number> = {};
    rows.forEach((r: any) => {
      compteur[r.type_cours] = (compteur[r.type_cours] || 0) + 1;
    });
    const cours_favori = Object.entries(compteur).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Séances ce mois
    const now = new Date();
    const seances_mois = rows.filter((r: any) => {
      const d = new Date(r.date_cours);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Activité par semaine (8 dernières semaines)
    const semaines: Record<string, number> = {};
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const yr = d.getFullYear();
      const wk = getWeekNumber(d);
      semaines[`${yr}-S${String(wk).padStart(2, "0")}`] = 0;
    }
    rows.forEach((r: any) => {
      const d = new Date(r.date_cours);
      const yr = d.getFullYear();
      const wk = getWeekNumber(d);
      const key = `${yr}-S${String(wk).padStart(2, "0")}`;
      if (key in semaines) semaines[key]++;
    });
    const activite_semaines = Object.entries(semaines)
      .map(([semaine, count]) => ({ semaine, count }))
      .reverse();

    res.json({
      stats: { total_seances, total_heures, cours_favori, seances_mois },
      activite_semaines,
      historique: rows,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

router.post("/", authMiddleware, async (req, res) => {
  const { id_membre, id_cours } = req.body;
  try {
    const [cours]: any = await pool.query(
      "SELECT * FROM cours WHERE id_cours = ? AND statut = 'publie'",
      [id_cours]
    );
    if (!cours.length) return res.status(404).json({ error: "Cours non trouvé" });
    if (cours[0].places_restantes <= 0)
      return res.status(400).json({ error: "Plus de places disponibles" });

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
    const diff = coursDate.getTime() - Date.now();

    if (diff < 48 * 60 * 60 * 1000)
      return res.status(400).json({ error: "Annulation impossible (délai de 48h dépassé)" });

    await pool.query(
      "UPDATE reservation SET statut = 'annulee' WHERE id_reservation = ?",
      [req.params.id]
    );
    await pool.query(
      "UPDATE cours SET places_restantes = places_restantes + 1 WHERE id_cours = ?",
      [res_.id_cours]
    );
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
