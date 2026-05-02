/**
 * Messagerie bidirectionnelle
 * Utilise la table notification avec type_notif = 'chat'
 * contenu = JSON: { from_id, from_name, to_id, text }
 */
import { Router } from "express";
import pool from "../lib/db.js";
import { authMiddleware } from "../lib/auth.js";
import { pushNotification } from "../lib/ws.js";

const router = Router();

// Liste des conversations d'un utilisateur
router.get("/conversations/:id_util", authMiddleware, async (req, res) => {
  const myId = Number(req.params.id_util);
  try {
    const [rows]: any = await pool.query(`
      SELECT n.*, u.nom, u.prenom, u.role
      FROM notification n
      JOIN utilisateur u ON u.id_util = u.id_util
      WHERE n.type_notif = 'chat'
        AND (n.id_util = ? OR JSON_EXTRACT(n.contenu, '$.from_id') = ?)
      ORDER BY n.date_envoi DESC
    `, [myId, myId]);

    // Regrouper par interlocuteur
    const seen = new Set<number>();
    const convos: any[] = [];
    for (const row of rows) {
      let parsed: any = {};
      try { parsed = JSON.parse(row.contenu); } catch {}
      const otherId = row.id_util === myId ? parsed.from_id : row.id_util;
      if (!seen.has(otherId)) {
        seen.add(otherId);
        convos.push({ other_id: otherId, other_name: `${parsed.from_name || "?"}`, last_message: parsed.text, date: row.date_envoi });
      }
    }
    res.json(convos);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Messages entre deux utilisateurs
router.get("/:id_a/:id_b", authMiddleware, async (req, res) => {
  const idA = Number(req.params.id_a);
  const idB = Number(req.params.id_b);
  try {
    const [rows]: any = await pool.query(`
      SELECT n.*
      FROM notification n
      WHERE n.type_notif = 'chat'
        AND (
          (n.id_util = ? AND JSON_EXTRACT(n.contenu, '$.from_id') = ?)
          OR
          (n.id_util = ? AND JSON_EXTRACT(n.contenu, '$.from_id') = ?)
        )
      ORDER BY n.date_envoi ASC
      LIMIT 100
    `, [idA, idB, idB, idA]);

    const messages = rows.map((r: any) => {
      let parsed: any = {};
      try { parsed = JSON.parse(r.contenu); } catch {}
      return {
        id: r.id_notification,
        from_id: parsed.from_id,
        from_name: parsed.from_name,
        to_id: r.id_util,
        text: parsed.text,
        date: r.date_envoi,
      };
    });
    res.json(messages);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Envoyer un message
router.post("/", authMiddleware, async (req, res) => {
  const { from_id, from_name, to_id, text } = req.body;
  if (!from_id || !to_id || !text) return res.status(400).json({ error: "Champs manquants" });
  try {
    const contenu = JSON.stringify({ from_id, from_name, to_id, text });
    await pool.query(`
      INSERT INTO notification (id_util, type_notif, canal, contenu, statut)
      VALUES (?, 'chat', 'app', ?, 'envoye')
    `, [to_id, contenu]);

    // Push temps réel
    pushNotification(Number(to_id), {
      type: "chat",
      from_id, from_name, text,
      date: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Liste des contacts disponibles (coachs + admins pour membres, membres pour coachs, tout le monde pour admin)
router.get("/contacts/:id_util", authMiddleware, async (req, res) => {
  const myId = Number(req.params.id_util);
  try {
    const [myRows]: any = await pool.query("SELECT role FROM utilisateur WHERE id_util = ?", [myId]);
    const myRole = myRows[0]?.role;

    let query = "";
    if (myRole === "membre") {
      query = `SELECT id_util, nom, prenom, role FROM utilisateur WHERE statut=1 AND role IN ('coach','administrateur','gerant') AND id_util != ${myId}`;
    } else if (myRole === "coach") {
      query = `SELECT id_util, nom, prenom, role FROM utilisateur WHERE statut=1 AND role IN ('membre','administrateur','gerant') AND id_util != ${myId}`;
    } else {
      query = `SELECT id_util, nom, prenom, role FROM utilisateur WHERE statut=1 AND id_util != ${myId}`;
    }

    const [rows]: any = await pool.query(query);
    res.json(rows);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
