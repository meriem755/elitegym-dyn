import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/cours/:id_cours", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT r.id_reservation, r.id_membre, r.statut as statut_resa,
             u.nom, u.prenom, u.telephone, m.date_inscription,
             COALESCE((
               SELECT 1 FROM journal_audit j
               WHERE j.table_affectee = 'presence'
               AND j.enregistrement_id = r.id_reservation
               LIMIT 1
             ), 0) as present
      FROM reservation r
      JOIN membre m ON r.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE r.id_cours = ? AND r.statut = 'confirmee'
      ORDER BY u.nom, u.prenom
    `, [req.params.id_cours]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/marquer", authMiddleware, async (req, res) => {
  const { id_cours, presences } = req.body;
  if (!id_cours || !Array.isArray(presences)) {
    return res.status(400).json({ error: "id_cours et presences[] requis" });
  }
  try {
    for (const p of presences) {
      if (p.present) {
        const [[existing]]: any = await pool.query(
          "SELECT id_journal FROM journal_audit WHERE table_affectee='presence' AND enregistrement_id=?",
          [p.id_reservation]
        );
        if (!existing) {
          await pool.query(
            "INSERT INTO journal_audit (id_util, action, table_affectee, enregistrement_id) VALUES (?, ?, 'presence', ?)",
            [req.body.id_util_coach || 1, `Présence cours #${id_cours} membre #${p.id_membre}`, p.id_reservation]
          );
        }
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [paiements]: any = await pool.query(`
      SELECT p.id_paiement, p.montant, p.mode_paiement, p.motif, p.statut, p.date_heure,
             f.nom as formule_nom
      FROM paiement p
      LEFT JOIN abonnement a ON p.id_abonnement = a.id_abonnement
      LEFT JOIN formule_abonnement f ON a.id_formule = f.id_formule
      WHERE p.id_membre = ?
      ORDER BY p.date_heure DESC
    `, [req.params.id_membre]);
    res.json(paiements);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



export default router;
