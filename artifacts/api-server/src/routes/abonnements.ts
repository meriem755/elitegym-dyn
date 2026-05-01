import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/formules", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM formule_abonnement WHERE actif = 1");
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT a.*, f.nom, f.tarif, f.description
      FROM abonnement a
      JOIN formule_abonnement f ON a.id_formule = f.id_formule
      WHERE a.id_membre = ?
      ORDER BY a.date_debut DESC
    `, [req.params.id_membre]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { id_membre, id_formule, date_debut } = req.body;
  try {
    const [formule]: any = await pool.query("SELECT * FROM formule_abonnement WHERE id_formule = ?", [id_formule]);
    if (!formule.length) return res.status(404).json({ error: "Formule non trouvée" });
    const f = formule[0];
    const debut = new Date(date_debut);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + f.duree_jours);

    const [result]: any = await pool.query(`
      INSERT INTO abonnement (id_membre, id_formule, date_debut, date_fin) VALUES (?, ?, ?, ?)
    `, [id_membre, id_formule, debut.toISOString().slice(0, 10), fin.toISOString().slice(0, 10)]);

    await pool.query(`
      INSERT INTO paiement (id_membre, id_abonnement, montant, mode_paiement, motif, statut)
      VALUES (?, ?, ?, 'carte', 'Abonnement en ligne', 'valide')
    `, [id_membre, result.insertId, f.tarif]);

    res.json({ success: true, id_abonnement: result.insertId });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
