import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../lib/db.js";
import { signToken, authMiddleware } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { telephone, mot_de_passe } = req.body;
  if (!telephone || !mot_de_passe)
    return res.status(400).json({ error: "Téléphone/email et mot de passe requis" });
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM utilisateur WHERE (telephone = ? OR email = ?) AND statut = 1",
      [telephone, telephone]
    );
    if (!rows.length) return res.status(401).json({ error: "Identifiants incorrects" });
    const user = rows[0];
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) return res.status(401).json({ error: "Identifiants incorrects" });
    await pool.query("UPDATE utilisateur SET last_login = NOW() WHERE id_util = ?", [user.id_util]);

    let id_membre: number | undefined;
    let id_coach: number | undefined;
    if (user.role === "membre") {
      const [m]: any = await pool.query("SELECT id_membre FROM membre WHERE id_util = ?", [user.id_util]);
      if (m.length) id_membre = m[0].id_membre;
    } else if (user.role === "coach") {
      const [c]: any = await pool.query("SELECT id_coach FROM coach WHERE id_util = ?", [user.id_util]);
      if (c.length) id_coach = c[0].id_coach;
    }

    const token = signToken({ id: user.id_util, role: user.role, nom: user.nom, prenom: user.prenom });
    res.json({
      token, role: user.role, nom: user.nom, prenom: user.prenom,
      id: user.id_util, email: user.email, telephone: user.telephone,
      id_membre, id_coach,
    });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/change-password", authMiddleware, async (req, res) => {
  const { id_util, ancien_mdp, nouveau_mdp } = req.body;
  try {
    const [rows]: any = await pool.query("SELECT mot_de_passe FROM utilisateur WHERE id_util = ?", [id_util]);
    if (!rows.length) return res.status(404).json({ error: "Utilisateur non trouvé" });
    const valid = await bcrypt.compare(ancien_mdp, rows[0].mot_de_passe);
    if (!valid) return res.status(401).json({ error: "Ancien mot de passe incorrect" });
    const hash = await bcrypt.hash(nouveau_mdp, 12);
    await pool.query("UPDATE utilisateur SET mot_de_passe = ? WHERE id_util = ?", [hash, id_util]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/change-phone", authMiddleware, async (req, res) => {
  const { id_util, telephone } = req.body;
  try {
    await pool.query("UPDATE utilisateur SET telephone = ? WHERE id_util = ?", [telephone, id_util]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/change-email", authMiddleware, async (req, res) => {
  const { id_util, email } = req.body;
  try {
    await pool.query("UPDATE utilisateur SET email = ? WHERE id_util = ?", [email, id_util]);
    res.json({ success: true });
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/profil/:id_util", authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT u.id_util, u.nom, u.prenom, u.role, u.email, u.telephone, u.date_creation,
             c.specialite, c.date_embauche, c.id_coach,
             m.date_inscription, m.id_membre
      FROM utilisateur u
      LEFT JOIN coach c ON c.id_util = u.id_util
      LEFT JOIN membre m ON m.id_util = u.id_util
      WHERE u.id_util = ? AND u.statut = 1
    `, [req.params.id_util]);
    if (!rows.length) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
