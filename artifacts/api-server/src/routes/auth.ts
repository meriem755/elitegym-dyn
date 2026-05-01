import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../lib/db.js";
import { signToken } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { telephone, mot_de_passe } = req.body;
  if (!telephone || !mot_de_passe) {
    return res.status(400).json({ error: "Téléphone et mot de passe requis" });
  }
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM utilisateur WHERE telephone = ? AND statut = 1",
      [telephone]
    );
    if (!rows.length) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }
    await pool.query("UPDATE utilisateur SET last_login = NOW() WHERE id_util = ?", [user.id_util]);
    const token = signToken({ id: user.id_util, role: user.role, nom: user.nom, prenom: user.prenom });
    res.json({ token, role: user.role, nom: user.nom, prenom: user.prenom, id: user.id_util });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/change-password", async (req, res) => {
  const { id_util, ancien_mdp, nouveau_mdp } = req.body;
  try {
    const [rows]: any = await pool.query("SELECT * FROM utilisateur WHERE id_util = ?", [id_util]);
    if (!rows.length) return res.status(404).json({ error: "Utilisateur non trouvé" });
    const user = rows[0];
    const valid = await bcrypt.compare(ancien_mdp, user.mot_de_passe);
    if (!valid) return res.status(401).json({ error: "Ancien mot de passe incorrect" });
    const hash = await bcrypt.hash(nouveau_mdp, 12);
    await pool.query("UPDATE utilisateur SET mot_de_passe = ? WHERE id_util = ?", [hash, id_util]);
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/change-phone", async (req, res) => {
  const { id_util, telephone } = req.body;
  try {
    await pool.query("UPDATE utilisateur SET telephone = ? WHERE id_util = ?", [telephone, id_util]);
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
