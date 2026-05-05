import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// Formules actives (public)
router.get("/formules", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM formule_abonnement WHERE actif = 1 ORDER BY tarif ASC");
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Abonnements d'un membre
router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT a.*, f.nom as formule_nom, f.tarif, f.description, f.duree_jours
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

// Abonnement admin direct (avec paiement validé immédiatement)
router.post("/", authMiddleware, async (req, res) => {
  const { id_membre, id_formule, date_debut } = req.body;
  try {
    const [formule]: any = await pool.query(
      "SELECT * FROM formule_abonnement WHERE id_formule = ?",
      [id_formule]
    );
    if (!formule.length) return res.status(404).json({ error: "Formule non trouvée" });
    const f = formule[0];
    const debut = new Date(date_debut || new Date());
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + f.duree_jours);

    const [result]: any = await pool.query(`
      INSERT INTO abonnement (id_membre, id_formule, date_debut, date_fin, statut)
      VALUES (?, ?, ?, ?, 'actif')
    `, [id_membre, id_formule, debut.toISOString().slice(0, 10), fin.toISOString().slice(0, 10)]);

    await pool.query(`
      INSERT INTO paiement (id_membre, id_abonnement, montant, mode_paiement, motif, statut)
      VALUES (?, ?, ?, 'espèces', 'Abonnement admin', 'valide')
    `, [id_membre, result.insertId, f.tarif]);

    res.json({ success: true, id_abonnement: result.insertId });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── RENOUVELLEMENT EN LIGNE (membre) ─────────────────────────────────────────
// Enregistre une demande de renouvellement avec paiement en_attente
// L'admin valide ensuite → notification envoyée au membre
router.post("/renouveler", authMiddleware, async (req, res) => {
  const { id_membre, id_util, id_formule, mode_paiement, montant } = req.body;
  if (!id_membre || !id_formule) {
    return res.status(400).json({ error: "id_membre et id_formule requis" });
  }
  try {
    const [formule]: any = await pool.query(
      "SELECT * FROM formule_abonnement WHERE id_formule = ? AND actif = 1",
      [id_formule]
    );
    if (!formule.length) return res.status(404).json({ error: "Formule non trouvée ou inactive" });
    const f = formule[0];

    // Calcul dates (début = aujourd'hui ou fin de l'abo actuel si encore actif)
    const [aboActif]: any = await pool.query(`
      SELECT date_fin FROM abonnement
      WHERE id_membre = ? AND statut = 'actif' AND date_fin >= CURDATE()
      ORDER BY date_fin DESC LIMIT 1
    `, [id_membre]);

    const debut = aboActif.length
      ? new Date(new Date(aboActif[0].date_fin).getTime() + 86400000)
      : new Date();
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + f.duree_jours);

    // Créer l'abonnement en statut "en_attente"
    const [aboResult]: any = await pool.query(`
      INSERT INTO abonnement (id_membre, id_formule, date_debut, date_fin, statut)
      VALUES (?, ?, ?, ?, 'en_attente')
    `, [id_membre, id_formule, debut.toISOString().slice(0, 10), fin.toISOString().slice(0, 10)]);

    // Paiement en attente de validation
    const [paiResult]: any = await pool.query(`
      INSERT INTO paiement (id_membre, id_abonnement, montant, mode_paiement, motif, statut)
      VALUES (?, ?, ?, ?, 'Renouvellement en ligne', 'en_attente')
    `, [id_membre, aboResult.insertId, montant || f.tarif, mode_paiement || "espèces"]);

    // Notifier l'admin (id_util = 1 par défaut)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification (
        id_notif INT AUTO_INCREMENT PRIMARY KEY,
        id_util INT NOT NULL,
        titre VARCHAR(200) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        lu TINYINT DEFAULT 0,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_util) REFERENCES utilisateur(id_util) ON DELETE CASCADE
      )
    `);
    // Notifier admin
    await pool.query(`
      INSERT INTO notification (id_util, titre, message, type)
      VALUES (1, ?, ?, 'paiement')
    `, [
      `Demande de renouvellement — Membre #${id_membre}`,
      `Formule : ${f.nom} · ${Number(montant || f.tarif).toLocaleString()} DA · Mode : ${mode_paiement || "espèces"}`
    ]);

    // Notifier le membre
    if (id_util) {
      await pool.query(`
        INSERT INTO notification (id_util, titre, message, type)
        VALUES (?, ?, ?, 'abonnement')
      `, [
        id_util,
        "Demande de renouvellement envoyée ✓",
        `Votre demande pour la formule "${f.nom}" a bien été reçue. L'admin validera votre paiement prochainement.`
      ]);
    }

    res.json({
      success: true,
      id_abonnement: aboResult.insertId,
      id_paiement: paiResult.insertId,
      message: "Demande enregistrée, en attente de validation admin",
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résilier
router.put("/:id/resilier", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE abonnement SET statut = 'resilié' WHERE id_abonnement = ?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour statut (admin valide renouvellement)
router.put("/:id", authMiddleware, async (req, res) => {
  const { statut } = req.body;
  try {
    await pool.query(
      "UPDATE abonnement SET statut = ? WHERE id_abonnement = ?",
      [statut, req.params.id]
    );
    // Si validation → valider aussi le paiement associé + notifier membre
    if (statut === "actif") {
      const [abo]: any = await pool.query(`
        SELECT a.id_membre, m.id_util, f.nom as formule_nom
        FROM abonnement a
        JOIN membre m ON a.id_membre = m.id_membre
        JOIN formule_abonnement f ON a.id_formule = f.id_formule
        WHERE a.id_abonnement = ?
      `, [req.params.id]);
      if (abo.length) {
        await pool.query(
          "UPDATE paiement SET statut = 'valide' WHERE id_abonnement = ? AND statut = 'en_attente'",
          [req.params.id]
        );
        await pool.query(`
          INSERT INTO notification (id_util, titre, message, type)
          VALUES (?, ?, ?, 'abonnement')
        `, [
          abo[0].id_util,
          "Abonnement activé ✓",
          `Votre abonnement "${abo[0].formule_nom}" a été validé et activé. Bienvenue !`
        ]);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
