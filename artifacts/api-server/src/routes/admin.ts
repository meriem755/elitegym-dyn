import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// ── MEMBRES ──────────────────────────────────────────────
router.get("/membres", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT u.id_util, u.nom, u.prenom, u.telephone, u.email, u.date_creation,
             m.id_membre, m.date_inscription
      FROM membre m JOIN utilisateur u ON m.id_util = u.id_util WHERE u.statut = 1
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/membres/:id", authMiddleware, async (req, res) => {
  const { nom, prenom, telephone, email } = req.body;
  try {
    await pool.query(
      "UPDATE utilisateur u JOIN membre m ON m.id_util = u.id_util SET u.nom=?, u.prenom=?, u.telephone=?, u.email=? WHERE m.id_membre=?",
      [nom, prenom, telephone || null, email || null, req.params.id]
    );
    await pool.query(
      "INSERT INTO journal_audit (id_util, action, table_affectee, enregistrement_id) VALUES (?, ?, 'membre', ?)",
      [req.body.id_util_admin || 1, `Modification membre #${req.params.id}`, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/membres/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE utilisateur u JOIN membre m ON m.id_util = u.id_util SET u.statut = 0 WHERE m.id_membre = ?",
      [req.params.id]
    );
    await pool.query(
      "INSERT INTO journal_audit (id_util, action, table_affectee, enregistrement_id) VALUES (?, ?, 'membre', ?)",
      [req.body.id_util_admin || 1, `Suppression membre #${req.params.id}`, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/membres", authMiddleware, async (req, res) => {
  const { nom, prenom, telephone, email, mot_de_passe } = req.body;
  try {
    const hash = await bcrypt.hash(mot_de_passe || "elitegym2026", 12);
    const [result]: any = await pool.query(`
      INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role)
      VALUES (?, ?, ?, ?, ?, 'membre')
    `, [nom, prenom, email || `${telephone}@elitegym.dz`, hash, telephone]);
    await pool.query("INSERT INTO membre (id_util, date_inscription) VALUES (?, CURDATE())", [result.insertId]);
    res.json({ success: true, id_util: result.insertId });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Téléphone ou email déjà utilisé" }); }
});

// ── COACHS ───────────────────────────────────────────────
router.get("/coachs", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT u.id_util, u.nom, u.prenom, u.telephone, u.email,
             c.id_coach, c.specialite, c.date_embauche
      FROM coach c JOIN utilisateur u ON c.id_util = u.id_util WHERE u.statut = 1
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/coachs/:id", authMiddleware, async (req, res) => {
  const { nom, prenom, telephone, email, specialite } = req.body;
  try {
    await pool.query(
      "UPDATE utilisateur u JOIN coach c ON c.id_util = u.id_util SET u.nom=?, u.prenom=?, u.telephone=?, u.email=?, c.specialite=? WHERE c.id_coach=?",
      [nom, prenom, telephone || null, email || null, specialite, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/coachs/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE utilisateur u JOIN coach c ON c.id_util = u.id_util SET u.statut = 0 WHERE c.id_coach = ?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/coachs", authMiddleware, async (req, res) => {
  const { nom, prenom, telephone, email, specialite, mot_de_passe } = req.body;
  try {
    const hash = await bcrypt.hash(mot_de_passe || "elitegym2026", 12);
    const [result]: any = await pool.query(`
      INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role)
      VALUES (?, ?, ?, ?, ?, 'coach')
    `, [nom, prenom, email || `${telephone}@elitegym.dz`, hash, telephone]);
    await pool.query("INSERT INTO coach (id_util, specialite, date_embauche) VALUES (?, ?, CURDATE())", [result.insertId, specialite]);
    res.json({ success: true, id_util: result.insertId });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Téléphone ou email déjà utilisé" }); }
});

// ── PAIEMENTS ─────────────────────────────────────────────
router.get("/paiements", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, u.nom, u.prenom, f.nom as formule_nom
      FROM paiement p
      JOIN membre m ON p.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      LEFT JOIN abonnement a ON p.id_abonnement = a.id_abonnement
      LEFT JOIN formule_abonnement f ON a.id_formule = f.id_formule
      ORDER BY p.date_heure DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/paiements", authMiddleware, async (req, res) => {
  const { id_membre, montant, mode_paiement, motif } = req.body;
  try {
    await pool.query(
      "INSERT INTO paiement (id_membre, montant, mode_paiement, motif, statut) VALUES (?, ?, ?, ?, 'valide')",
      [id_membre, montant, mode_paiement || "espèces", motif || "Abonnement"]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── FORMULES ABONNEMENT ────────────────────────────────────
router.get("/formules", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM formule_abonnement ORDER BY tarif ASC");
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/formules", authMiddleware, async (req, res) => {
  const { nom, description, tarif, duree_jours } = req.body;
  try {
    await pool.query(
      "INSERT INTO formule_abonnement (nom, description, tarif, duree_jours) VALUES (?, ?, ?, ?)",
      [nom, description || "", tarif, duree_jours]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/formules/:id", authMiddleware, async (req, res) => {
  const { nom, description, tarif, duree_jours, actif } = req.body;
  try {
    await pool.query(
      "UPDATE formule_abonnement SET nom=?, description=?, tarif=?, duree_jours=?, actif=? WHERE id_formule=?",
      [nom, description || "", tarif, duree_jours, actif ?? 1, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/formules/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE formule_abonnement SET actif = 0 WHERE id_formule = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── ABONNEMENTS MEMBRES ────────────────────────────────────
router.get("/abonnements", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT a.*, f.nom as formule_nom, f.tarif, f.duree_jours,
             u.nom, u.prenom, m.id_membre
      FROM abonnement a
      JOIN formule_abonnement f ON a.id_formule = f.id_formule
      JOIN membre m ON a.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE u.statut = 1
      ORDER BY a.date_debut DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/abonnements", authMiddleware, async (req, res) => {
  const { id_membre, id_formule, date_debut } = req.body;
  try {
    const [formule]: any = await pool.query("SELECT * FROM formule_abonnement WHERE id_formule = ?", [id_formule]);
    if (!formule.length) return res.status(404).json({ error: "Formule non trouvée" });
    const f = formule[0];
    const debut = new Date(date_debut || new Date());
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + f.duree_jours);
    const [result]: any = await pool.query(
      "INSERT INTO abonnement (id_membre, id_formule, date_debut, date_fin) VALUES (?, ?, ?, ?)",
      [id_membre, id_formule, debut.toISOString().slice(0, 10), fin.toISOString().slice(0, 10)]
    );
    await pool.query(
      "INSERT INTO paiement (id_membre, id_abonnement, montant, mode_paiement, motif, statut) VALUES (?, ?, ?, 'espèces', 'Abonnement admin', 'valide')",
      [id_membre, result.insertId, f.tarif]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/abonnements/:id", authMiddleware, async (req, res) => {
  const { statut } = req.body;
  try {
    await pool.query("UPDATE abonnement SET statut=? WHERE id_abonnement=?", [statut, req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── ÉQUIPEMENTS ────────────────────────────────────────────
router.get("/equipements", authMiddleware, async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipement (
        id_equipement INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        categorie VARCHAR(50) DEFAULT 'Autre',
        etat ENUM('bon','usure','maintenance','hors_service') DEFAULT 'bon',
        quantite INT DEFAULT 1,
        date_acquisition DATE,
        notes TEXT,
        date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [rows]: any = await pool.query("SELECT * FROM equipement ORDER BY categorie, nom");
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/equipements", authMiddleware, async (req, res) => {
  const { nom, categorie, etat, quantite, date_acquisition, notes } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipement (
        id_equipement INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        categorie VARCHAR(50) DEFAULT 'Autre',
        etat ENUM('bon','usure','maintenance','hors_service') DEFAULT 'bon',
        quantite INT DEFAULT 1,
        date_acquisition DATE,
        notes TEXT,
        date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await pool.query(
      "INSERT INTO equipement (nom, categorie, etat, quantite, date_acquisition, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [nom, categorie || "Autre", etat || "bon", quantite || 1, date_acquisition || null, notes || null]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/equipements/:id", authMiddleware, async (req, res) => {
  const { nom, categorie, etat, quantite, notes } = req.body;
  try {
    await pool.query(
      "UPDATE equipement SET nom=?, categorie=?, etat=?, quantite=?, notes=? WHERE id_equipement=?",
      [nom, categorie, etat, quantite, notes || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/equipements/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM equipement WHERE id_equipement=?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── PLANNING ───────────────────────────────────────────────
router.get("/cours-en-attente", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.nom, u.prenom, co.specialite
      FROM cours c
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur u ON co.id_util = u.id_util
      WHERE c.statut = 'en_attente'
      ORDER BY c.date_cours, c.heure_debut
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/cours/:id/approuver", authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE cours SET statut = 'publie' WHERE id_cours = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/cours/:id/rejeter", authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE cours SET statut = 'annule' WHERE id_cours = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── AUDIT ──────────────────────────────────────────────────
router.get("/audit", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT j.*, u.nom, u.prenom FROM journal_audit j
      JOIN utilisateur u ON j.id_util = u.id_util
      ORDER BY j.date_action DESC LIMIT 200
    `);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── STATS TABLEAU DE BORD ──────────────────────────────────
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const [[m]]: any = await pool.query("SELECT COUNT(*) as n FROM membre m JOIN utilisateur u ON m.id_util = u.id_util WHERE u.statut=1");
    const [[c]]: any = await pool.query("SELECT COUNT(*) as n FROM coach c JOIN utilisateur u ON c.id_util = u.id_util WHERE u.statut=1");
    const [[r]]: any = await pool.query("SELECT COUNT(*) as n FROM reservation WHERE statut='confirmee'");
    const [[a]]: any = await pool.query("SELECT COUNT(*) as n FROM cours WHERE statut='en_attente'");
    const [[rev]]: any = await pool.query("SELECT COALESCE(SUM(montant),0) as total FROM paiement WHERE statut='valide' AND MONTH(date_heure)=MONTH(CURDATE()) AND YEAR(date_heure)=YEAR(CURDATE())");
    const [[revTotal]]: any = await pool.query("SELECT COALESCE(SUM(montant),0) as total FROM paiement WHERE statut='valide'");
    const [[abActifs]]: any = await pool.query("SELECT COUNT(*) as n FROM abonnement WHERE statut='actif' AND date_fin >= CURDATE()");
    const [[coursTotal]]: any = await pool.query("SELECT COUNT(*) as n FROM cours WHERE statut='publie'");
    const [revMensuel]: any = await pool.query(`
      SELECT DATE_FORMAT(date_heure,'%Y-%m') as mois, SUM(montant) as total
      FROM paiement WHERE statut='valide' AND date_heure >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mois ORDER BY mois ASC
    `);
    res.json({
      membres: m.n, coachs: c.n, reservations: r.n, en_attente: a.n,
      revenu_mois: rev.total, revenu_total: revTotal.total,
      abonnements_actifs: abActifs.n, cours_publies: coursTotal.n,
      revenu_mensuel: revMensuel,
    });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── SAUVEGARDE ─────────────────────────────────────────────
router.post("/backup", authMiddleware, async (req, res) => {
  try {
    const ts = new Date().toISOString();
    const [[m]]: any = await pool.query("SELECT COUNT(*) as n FROM membre");
    const [[c]]: any = await pool.query("SELECT COUNT(*) as n FROM coach");
    const [[p]]: any = await pool.query("SELECT COUNT(*) as n FROM paiement");
    const [[a]]: any = await pool.query("SELECT COUNT(*) as n FROM abonnement");
    await pool.query(
      "INSERT INTO journal_audit (id_util, action, table_affectee) VALUES (?, ?, 'systeme')",
      [req.body.id_util || 1, `Sauvegarde système effectuée le ${ts}`]
    );
    res.json({
      success: true,
      timestamp: ts,
      stats: { membres: m.n, coachs: c.n, paiements: p.n, abonnements: a.n },
    });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
