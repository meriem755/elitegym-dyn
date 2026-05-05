import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS avis (
      id_avis       INT AUTO_INCREMENT PRIMARY KEY,
      id_membre     INT NOT NULL,
      id_cours      INT NOT NULL,
      note          TINYINT NOT NULL,
      commentaire   TEXT,
      date_avis     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_membre) REFERENCES membre(id_membre) ON DELETE CASCADE,
      FOREIGN KEY (id_cours)  REFERENCES cours(id_cours)   ON DELETE CASCADE,
      UNIQUE KEY uq_avis (id_membre, id_cours)
    )
  `);
}
ensureTable().catch(() => {});

// POST /avis — déposer ou mettre à jour un avis
router.post("/", authMiddleware, async (req, res) => {
  const { id_membre, id_cours, note, commentaire } = req.body;
  if (!id_membre || !id_cours || !note) {
    return res.status(400).json({ error: "Champs requis : id_membre, id_cours, note" });
  }
  if (note < 1 || note > 5) {
    return res.status(400).json({ error: "Note doit être entre 1 et 5" });
  }
  try {
    // Vérifier que le membre a bien une réservation confirmée pour ce cours
    // (date_cours <= CURDATE pour inclure aujourd'hui)
    const [resa]: any = await pool.query(`
      SELECT r.id_reservation
      FROM reservation r
      JOIN cours c ON r.id_cours = c.id_cours
      WHERE r.id_membre = ? AND r.id_cours = ?
        AND r.statut = 'confirmee'
        AND c.date_cours <= CURDATE()
    `, [id_membre, id_cours]);

    if (!resa.length) {
      return res.status(403).json({
        error: "Vous ne pouvez noter que les cours auxquels vous avez participé"
      });
    }

    // Upsert (créer ou mettre à jour)
    await pool.query(`
      INSERT INTO avis (id_membre, id_cours, note, commentaire)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        note = VALUES(note),
        commentaire = VALUES(commentaire),
        date_avis = NOW()
    `, [id_membre, id_cours, note, commentaire || null]);

    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /avis/membre/:id_membre — avis déposés par le membre
router.get("/membre/:id_membre", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT a.id_avis, a.id_cours, a.note, a.commentaire, a.date_avis,
             c.type_cours, c.date_cours
      FROM avis a
      JOIN cours c ON a.id_cours = c.id_cours
      WHERE a.id_membre = ?
      ORDER BY a.date_avis DESC
    `, [req.params.id_membre]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /avis/cours/:id_cours
router.get("/cours/:id_cours", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT a.id_avis, a.note, a.commentaire, a.date_avis,
             CONCAT(u.prenom, ' ', u.nom) AS membre_nom
      FROM avis a
      JOIN membre m ON a.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE a.id_cours = ?
      ORDER BY a.date_avis DESC
    `, [req.params.id_cours]);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /avis/coach/:id_coach — avis + moyennes par cours
router.get("/coach/:id_coach", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        a.id_avis, a.note, a.commentaire, a.date_avis,
        c.id_cours, c.type_cours, c.date_cours, c.salle,
        CONCAT(u.prenom, ' ', u.nom) AS membre_nom
      FROM avis a
      JOIN cours c ON a.id_cours = c.id_cours
      JOIN membre m ON a.id_membre = m.id_membre
      JOIN utilisateur u ON m.id_util = u.id_util
      WHERE c.id_coach = ?
      ORDER BY a.date_avis DESC
    `, [req.params.id_coach]);

    const [moyennes]: any = await pool.query(`
      SELECT
        c.id_cours, c.type_cours, c.date_cours, c.salle,
        ROUND(AVG(a.note), 1) AS note_moyenne,
        COUNT(a.id_avis) AS nb_avis
      FROM cours c
      LEFT JOIN avis a ON a.id_cours = c.id_cours
      WHERE c.id_coach = ?
      GROUP BY c.id_cours
      HAVING nb_avis > 0
      ORDER BY c.date_cours DESC
    `, [req.params.id_coach]);

    res.json({ avis: rows, moyennes });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /avis/admin
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        a.id_avis, a.note, a.commentaire, a.date_avis,
        c.type_cours, c.date_cours,
        CONCAT(um.prenom, ' ', um.nom) AS membre_nom,
        CONCAT(uc.prenom, ' ', uc.nom) AS coach_nom
      FROM avis a
      JOIN cours c ON a.id_cours = c.id_cours
      JOIN coach co ON c.id_coach = co.id_coach
      JOIN utilisateur uc ON co.id_util = uc.id_util
      JOIN membre me ON a.id_membre = me.id_membre
      JOIN utilisateur um ON me.id_util = um.id_util
      ORDER BY a.date_avis DESC LIMIT 200
    `);
    res.json(rows);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
