import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Platform,
  Modal, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab =
  | "dashboard" | "membres" | "coachs" | "planning"
  | "paiements" | "abonnements" | "equipements" | "audit" | "parametres";

const ETAT_INFO: Record<string, { label: string; color: string }> = {
  bon:          { label: "Bon état",      color: "#10b981" },
  usure:        { label: "Usure",         color: "#f59e0b" },
  maintenance:  { label: "Maintenance",   color: "#3b82f6" },
  hors_service: { label: "Hors service",  color: "#ef4444" },
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: "#f59e0b", publie: "#10b981", annule: "#ef4444", termine: "#6b7280",
};

const MODES_PAIEMENT = ["espèces", "CIB", "BaridiMob", "virement", "chèque"];

function Empty({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
      <Feather name={icon as any} size={30} color={colors.mutedForeground} />
      <Text style={[s.sub, { color: colors.mutedForeground, textAlign: "center" }]}>{text}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [refreshing, setRefreshing] = useState(false);

  const [membres, setMembres] = useState<any[]>([]);
  const [coachs, setCoachs] = useState<any[]>([]);
  const [coursEnAttente, setCoursEnAttente] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [formules, setFormules] = useState<any[]>([]);
  const [abonnements, setAbonnements] = useState<any[]>([]);
  const [equipements, setEquipements] = useState<any[]>([]);

  // Modals state
  const [showAddMembre, setShowAddMembre] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [editTarget, setEditTarget] = useState<{ type: "membre" | "coach"; data: any } | null>(null);
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [showAddFormule, setShowAddFormule] = useState(false);
  const [editFormule, setEditFormule] = useState<any>(null);
  const [showAffecterAbo, setShowAffecterAbo] = useState(false);
  const [showAddEquipement, setShowAddEquipement] = useState(false);
  const [editEquipement, setEditEquipement] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Forms
  const [newForm, setNewForm] = useState({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
  const [paiForm, setPaiForm] = useState({ id_membre: "", montant: "", mode_paiement: "espèces", motif: "Abonnement" });
  const [formulForm, setFormulForm] = useState({ nom: "", description: "", tarif: "", duree_jours: "" });
  const [aboForm, setAboForm] = useState({ id_membre: "", id_formule: "", date_debut: new Date().toISOString().slice(0,10) });
  const [equipForm, setEquipForm] = useState({ nom: "", categorie: "Musculation", etat: "bon", quantite: "1", notes: "" });

  // Paramètres
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [nouvelEmail, setNouvelEmail] = useState("");
  const [loadingParam, setLoadingParam] = useState(false);

  const load = async () => {
    try {
      const [m, c, p, a, st, cours, f, ab, eq] = await Promise.all([
        api.get("/admin/membres"),
        api.get("/admin/coachs"),
        api.get("/admin/paiements"),
        api.get("/admin/audit"),
        api.get("/admin/stats").catch(() => ({})),
        api.get("/admin/cours-en-attente"),
        api.get("/admin/formules").catch(() => []),
        api.get("/admin/abonnements").catch(() => []),
        api.get("/admin/equipements").catch(() => []),
      ]);
      setMembres(m); setCoachs(c); setPaiements(p); setAudit(a);
      setStats(st); setCoursEnAttente(cours);
      setFormules(f); setAbonnements(ab); setEquipements(eq);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Handlers membres/coachs ───────────────────────────────
  const handleAjouterMembre = async () => {
    if (!newForm.nom || !newForm.prenom || (!newForm.telephone && !newForm.email)) {
      Alert.alert("Erreur", "Remplissez nom, prénom et au moins un contact"); return;
    }
    setLoading(true);
    try {
      await api.post("/admin/membres", newForm);
      Alert.alert("Succès", "Membre ajouté\nMot de passe par défaut : elitegym2026");
      setShowAddMembre(false);
      setNewForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterCoach = async () => {
    if (!newForm.nom || !newForm.prenom || (!newForm.telephone && !newForm.email) || !newForm.specialite) {
      Alert.alert("Erreur", "Remplissez tous les champs"); return;
    }
    setLoading(true);
    try {
      await api.post("/admin/coachs", newForm);
      Alert.alert("Succès", "Coach ajouté\nMot de passe par défaut : elitegym2026");
      setShowAddCoach(false);
      setNewForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const openEditMembre = (m: any) => {
    setEditTarget({ type: "membre", data: m });
    setEditForm({ nom: m.nom, prenom: m.prenom, telephone: m.telephone || "", email: m.email || "", specialite: "" });
  };

  const openEditCoach = (c: any) => {
    setEditTarget({ type: "coach", data: c });
    setEditForm({ nom: c.nom, prenom: c.prenom, telephone: c.telephone || "", email: c.email || "", specialite: c.specialite || "" });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setLoading(true);
    try {
      if (editTarget.type === "membre") {
        await api.put(`/admin/membres/${editTarget.data.id_membre}`, editForm);
      } else {
        await api.put(`/admin/coachs/${editTarget.data.id_coach}`, editForm);
      }
      Alert.alert("Succès", "Informations modifiées ✓");
      setEditTarget(null);
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = (type: "membre" | "coach", id: number, nom: string) => {
    Alert.alert("Confirmer suppression", `Supprimer ${nom} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            if (type === "membre") await api.delete(`/admin/membres/${id}`);
            else await api.delete(`/admin/coachs/${id}`);
            load();
          } catch (e: any) { Alert.alert("Erreur", e.message); }
        },
      },
    ]);
  };

  // ── Planning ──────────────────────────────────────────────
  const handleApprouver = async (id: number) => {
    try { await api.put(`/admin/cours/${id}/approuver`); Alert.alert("Approuvé ✓", "Cours publié"); load(); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
  };
  const handleRejeter = async (id: number) => {
    Alert.alert("Confirmer", "Rejeter ce cours ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Rejeter", style: "destructive", onPress: async () => {
        try { await api.put(`/admin/cours/${id}/rejeter`); load(); }
        catch (e: any) { Alert.alert("Erreur", e.message); }
      }},
    ]);
  };

  // ── Paiements ─────────────────────────────────────────────
  const handleAddPaiement = async () => {
    if (!paiForm.id_membre || !paiForm.montant) { Alert.alert("Erreur", "Sélectionnez un membre et entrez un montant"); return; }
    setLoading(true);
    try {
      await api.post("/admin/paiements", { ...paiForm, montant: parseFloat(paiForm.montant) });
      Alert.alert("Succès", "Paiement enregistré ✓");
      setShowAddPaiement(false);
      setPaiForm({ id_membre: "", montant: "", mode_paiement: "espèces", motif: "Abonnement" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  // ── Formules ──────────────────────────────────────────────
  const handleSaveFormule = async () => {
    if (!formulForm.nom || !formulForm.tarif || !formulForm.duree_jours) { Alert.alert("Erreur", "Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      const body = { ...formulForm, tarif: parseFloat(formulForm.tarif), duree_jours: parseInt(formulForm.duree_jours) };
      if (editFormule) await api.put(`/admin/formules/${editFormule.id_formule}`, { ...editFormule, ...body });
      else await api.post("/admin/formules", body);
      Alert.alert("Succès", editFormule ? "Formule modifiée ✓" : "Formule créée ✓");
      setShowAddFormule(false); setEditFormule(null);
      setFormulForm({ nom: "", description: "", tarif: "", duree_jours: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteFormule = (f: any) => {
    Alert.alert("Désactiver", `Désactiver la formule "${f.nom}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Désactiver", style: "destructive", onPress: async () => {
        try { await api.delete(`/admin/formules/${f.id_formule}`); load(); }
        catch (e: any) { Alert.alert("Erreur", e.message); }
      }},
    ]);
  };

  // ── Abonnements ───────────────────────────────────────────
  const handleAffecterAbo = async () => {
    if (!aboForm.id_membre || !aboForm.id_formule) { Alert.alert("Erreur", "Sélectionnez un membre et une formule"); return; }
    setLoading(true);
    try {
      await api.post("/admin/abonnements", { ...aboForm, id_membre: parseInt(aboForm.id_membre), id_formule: parseInt(aboForm.id_formule) });
      Alert.alert("Succès", "Abonnement affecté ✓");
      setShowAffecterAbo(false);
      setAboForm({ id_membre: "", id_formule: "", date_debut: new Date().toISOString().slice(0,10) });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  // ── Équipements ───────────────────────────────────────────
  const handleSaveEquipement = async () => {
    if (!equipForm.nom) { Alert.alert("Erreur", "Entrez un nom d'équipement"); return; }
    setLoading(true);
    try {
      const body = { ...equipForm, quantite: parseInt(equipForm.quantite) || 1 };
      if (editEquipement) await api.put(`/admin/equipements/${editEquipement.id_equipement}`, body);
      else await api.post("/admin/equipements", body);
      Alert.alert("Succès", editEquipement ? "Équipement modifié ✓" : "Équipement ajouté ✓");
      setShowAddEquipement(false); setEditEquipement(null);
      setEquipForm({ nom: "", categorie: "Musculation", etat: "bon", quantite: "1", notes: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteEquipement = (eq: any) => {
    Alert.alert("Supprimer", `Supprimer "${eq.nom}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try { await api.delete(`/admin/equipements/${eq.id_equipement}`); load(); }
        catch (e: any) { Alert.alert("Erreur", e.message); }
      }},
    ]);
  };

  // ── Backup ────────────────────────────────────────────────
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const r = await api.post("/admin/backup", { id_util: user?.id });
      Alert.alert("Sauvegarde réussie ✓",
        `Effectuée le ${new Date(r.timestamp).toLocaleString("fr-FR")}\n`+
        `${r.stats.membres} membres · ${r.stats.coachs} coachs · ${r.stats.paiements} paiements`
      );
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setBackupLoading(false); }
  };

  // ── Paramètres ────────────────────────────────────────────
  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert("Erreur", "Remplissez les deux champs"); return; }
    if (nouveauMdp.length < 6) { Alert.alert("Erreur", "Min 6 caractères"); return; }
    setLoadingParam(true);
    try {
      await api.post("/auth/change-password", { id_util: user?.id, ancien_mdp: ancienMdp, nouveau_mdp: nouveauMdp });
      Alert.alert("Succès", "Mot de passe modifié ✓");
      setAncienMdp(""); setNouveauMdp("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const handleChangeTel = async () => {
    if (!nouveauTel) return;
    setLoadingParam(true);
    try {
      await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel });
      Alert.alert("Succès", "Numéro modifié ✓"); setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoadingParam(true);
    try {
      await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail });
      Alert.alert("Succès", "Email modifié ✓"); setNouvelEmail("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const TABS: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "dashboard",   label: "Tableau",     icon: "bar-chart-2" },
    { key: "membres",     label: "Membres",     icon: "users" },
    { key: "coachs",      label: "Coachs",      icon: "activity" },
    { key: "planning",    label: "Planning",    icon: "check-square", badge: coursEnAttente.length },
    { key: "paiements",   label: "Paiements",   icon: "credit-card" },
    { key: "abonnements", label: "Abonnements", icon: "tag" },
    { key: "equipements", label: "Équipements", icon: "tool" },
    { key: "audit",       label: "Audit",       icon: "file-text" },
    { key: "parametres",  label: "Paramètres",  icon: "settings" },
  ];

  // ── abonnements actifs/expirés stats ─────────────────────
  const aboActifs = abonnements.filter((a: any) => a.statut === "actif" && new Date(a.date_fin) >= new Date());
  const revenuMois = stats.revenu_mois ? Number(stats.revenu_mois).toLocaleString() : "—";
  const revenuTotal = stats.revenu_total ? Number(stats.revenu_total).toLocaleString() : "—";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 80 : insets.top }]}>
        <View>
          <Text style={s.headerTitle}>Espace Admin</Text>
          <Text style={s.headerSub}>{user?.prenom} {user?.nom}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={s.statsRow}>
        {[
          { label: "Membres",  value: membres.length,         color: colors.primary },
          { label: "Coachs",   value: coachs.length,          color: "#10b981" },
          { label: "En att.", value: coursEnAttente.length,   color: "#f59e0b" },
          { label: "Abo actifs", value: aboActifs.length,     color: "#8b5cf6" },
        ].map((st) => (
          <View key={st.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: st.color }]}>{st.value}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[s.tabBar, { borderBottomColor: colors.border }]}
      >
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[s.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <View style={{ position: "relative" }}>
              <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
              {t.badge && t.badge > 0 ? (
                <View style={s.badgeDot}><Text style={s.badgeText}>{t.badge}</Text></View>
              ) : null}
            </View>
            <Text style={[s.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <>
            <View style={[s.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Supervision globale</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {[
                  { icon: "users",    label: "Membres actifs",     value: membres.length,           color: colors.primary },
                  { icon: "activity", label: "Coachs actifs",      value: coachs.length,            color: "#10b981" },
                  { icon: "tag",      label: "Abonnements actifs", value: aboActifs.length,         color: "#8b5cf6" },
                  { icon: "check-circle", label: "Cours publiés",  value: stats.cours_publies ?? "—", color: "#3b82f6" },
                ].map((it) => (
                  <View key={it.label} style={[s.dashCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name={it.icon as any} size={20} color={it.color} />
                    <Text style={[s.dashNum, { color: it.color }]}>{it.value}</Text>
                    <Text style={[s.dashLabel, { color: colors.mutedForeground }]}>{it.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Revenus</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={[s.revCard, { backgroundColor: "#10b98110", borderColor: "#10b98130", flex: 1 }]}>
                  <Text style={[s.revNum, { color: "#10b981" }]}>{revenuMois} DA</Text>
                  <Text style={[s.revLabel, { color: colors.mutedForeground }]}>Ce mois</Text>
                </View>
                <View style={[s.revCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30", flex: 1 }]}>
                  <Text style={[s.revNum, { color: colors.primary }]}>{revenuTotal} DA</Text>
                  <Text style={[s.revLabel, { color: colors.mutedForeground }]}>Total cumulé</Text>
                </View>
              </View>
              {stats.revenu_mensuel && stats.revenu_mensuel.length > 0 && (
                <View style={{ marginTop: 10, gap: 4 }}>
                  <Text style={[s.sub, { color: colors.mutedForeground, fontWeight: "600" }]}>6 derniers mois</Text>
                  {stats.revenu_mensuel.map((rm: any) => (
                    <View key={rm.mois} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[s.sub, { color: colors.mutedForeground, width: 60 }]}>{rm.mois}</Text>
                      <View style={{ flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: "hidden" }}>
                        <View style={{
                          height: 8, borderRadius: 4, backgroundColor: colors.primary,
                          width: `${Math.min(100, (rm.total / (Math.max(...stats.revenu_mensuel.map((x: any) => x.total)) || 1)) * 100)}%`,
                        }} />
                      </View>
                      <Text style={[s.sub, { color: colors.foreground, fontWeight: "700", width: 80, textAlign: "right" }]}>
                        {Number(rm.total).toLocaleString()} DA
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Sauvegarde & Restauration</Text>
              <Text style={[s.sub, { color: colors.mutedForeground }]}>
                Sauvegardez l'état complet de la base de données (membres, coachs, paiements, abonnements).
              </Text>
              <EliteButton
                title={backupLoading ? "Sauvegarde en cours..." : "Lancer une sauvegarde"}
                onPress={handleBackup}
                loading={backupLoading}
                variant="secondary"
              />
              <View style={[s.infoBox, { backgroundColor: "#3b82f610", borderColor: "#3b82f630" }]}>
                <Text style={[s.sub, { color: "#1d4ed8" }]}>
                  ℹ️ La restauration s'effectue depuis l'interface de la base de données MySQL directement.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── MEMBRES ── */}
        {tab === "membres" && (
          <>
            <EliteButton title="+ Ajouter un membre" onPress={() => setShowAddMembre(true)} variant="primary" small />
            {membres.length === 0 ? <Empty icon="users" text="Aucun membre" /> :
              membres.map((m: any) => (
                <View key={m.id_membre} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={[s.avatar, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[s.avatarText, { color: colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>{m.telephone || m.email}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>
                        Membre #{m.id_membre} · Inscrit le {m.date_inscription?.slice(0, 10)}
                      </Text>
                    </View>
                  </View>
                  <View style={s.actionRow}>
                    <TouchableOpacity onPress={() => openEditMembre(m)} style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                      <Feather name="edit-2" size={13} color={colors.primary} />
                      <Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete("membre", m.id_membre, `${m.prenom} ${m.nom}`)} style={[s.actionBtn, { backgroundColor: "#ef444415", borderColor: "#ef4444" }]}>
                      <Feather name="trash-2" size={13} color="#ef4444" />
                      <Text style={[s.actionText, { color: "#ef4444" }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            }
          </>
        )}

        {/* ── COACHS ── */}
        {tab === "coachs" && (
          <>
            <EliteButton title="+ Ajouter un coach" onPress={() => setShowAddCoach(true)} variant="primary" small />
            {coachs.length === 0 ? <Empty icon="activity" text="Aucun coach" /> :
              coachs.map((c: any) => (
                <View key={c.id_coach} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={[s.avatar, { backgroundColor: "#10b98120" }]}>
                      <Text style={[s.avatarText, { color: "#10b981" }]}>{c.prenom?.[0]}{c.nom?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{c.prenom} {c.nom}</Text>
                      <Text style={[s.sub, { color: colors.primary }]}>{c.specialite}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>Coach #{c.id_coach} · {c.telephone || c.email}</Text>
                    </View>
                  </View>
                  <View style={s.actionRow}>
                    <TouchableOpacity onPress={() => openEditCoach(c)} style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                      <Feather name="edit-2" size={13} color={colors.primary} />
                      <Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete("coach", c.id_coach, `${c.prenom} ${c.nom}`)} style={[s.actionBtn, { backgroundColor: "#ef444415", borderColor: "#ef4444" }]}>
                      <Feather name="trash-2" size={13} color="#ef4444" />
                      <Text style={[s.actionText, { color: "#ef4444" }]}>Retirer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            }
          </>
        )}

        {/* ── PLANNING ── */}
        {tab === "planning" && (
          <>
            {coursEnAttente.length === 0 ? (
              <Empty icon="check-circle" text="Aucun cours en attente d'approbation" />
            ) : coursEnAttente.map((c: any) => (
              <View key={c.id_cours} style={[s.card, { backgroundColor: colors.card, borderColor: "#f59e0b40", borderWidth: 1.5 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.title, { color: colors.foreground }]}>{c.type_cours}</Text>
                    <Text style={[s.sub, { color: colors.primary, fontWeight: "600" }]}>Coach : {c.prenom} {c.nom}</Text>
                    <Text style={[s.sub, { color: colors.mutedForeground }]}>📅 {c.date_cours?.slice(0,10)} à {c.heure_debut?.slice(0,5)} · {c.duree_minutes} min</Text>
                    <Text style={[s.sub, { color: colors.mutedForeground }]}>🏠 {c.salle} · {c.capacite_max} places</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: "#f59e0b20" }]}>
                    <Text style={[s.statusText, { color: "#f59e0b" }]}>En attente</Text>
                  </View>
                </View>
                <View style={s.actionRow}>
                  <TouchableOpacity onPress={() => handleRejeter(c.id_cours)} style={[s.actionBtn, { backgroundColor: "#ef444420", borderColor: "#ef4444" }]}>
                    <Feather name="x" size={13} color="#ef4444" />
                    <Text style={[s.actionText, { color: "#ef4444" }]}>Rejeter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleApprouver(c.id_cours)} style={[s.actionBtn, { backgroundColor: "#10b98120", borderColor: "#10b981", flex: 2 }]}>
                    <Feather name="check" size={13} color="#10b981" />
                    <Text style={[s.actionText, { color: "#10b981" }]}>Approuver & Publier</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── PAIEMENTS ── */}
        {tab === "paiements" && (
          <>
            <EliteButton title="+ Enregistrer un paiement" onPress={() => setShowAddPaiement(true)} variant="primary" small />
            {paiements.length === 0 ? <Empty icon="credit-card" text="Aucun paiement enregistré" /> :
              paiements.map((p: any) => (
                <View key={p.id_paiement} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{p.prenom} {p.nom}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>{p.motif}{p.formule_nom ? ` · ${p.formule_nom}` : ""}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>
                        {new Date(p.date_heure).toLocaleDateString("fr-FR")} · {p.mode_paiement}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={[s.montant, { color: p.statut === "valide" ? "#10b981" : "#ef4444" }]}>
                        {Number(p.montant).toLocaleString()} DA
                      </Text>
                      <View style={[s.statusBadge, { backgroundColor: p.statut === "valide" ? "#10b98120" : "#ef444420" }]}>
                        <Text style={[s.statusText, { color: p.statut === "valide" ? "#10b981" : "#ef4444" }]}>{p.statut}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            }
          </>
        )}

        {/* ── ABONNEMENTS ── */}
        {tab === "abonnements" && (
          <>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}>
                <EliteButton title="+ Affecter abo" onPress={() => setShowAffecterAbo(true)} variant="primary" small />
              </View>
              <View style={{ flex: 1 }}>
                <EliteButton title="+ Formule" onPress={() => { setEditFormule(null); setFormulForm({ nom: "", description: "", tarif: "", duree_jours: "" }); setShowAddFormule(true); }} variant="secondary" small />
              </View>
            </View>

            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Formules d'abonnement</Text>
            {formules.length === 0 ? <Empty icon="tag" text="Aucune formule définie" /> :
              formules.map((f: any) => (
                <View key={f.id_formule} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{f.nom}</Text>
                      {f.description ? <Text style={[s.sub, { color: colors.mutedForeground }]}>{f.description}</Text> : null}
                      <Text style={[s.sub, { color: colors.primary, fontWeight: "700" }]}>
                        {Number(f.tarif).toLocaleString()} DA · {f.duree_jours} jours
                      </Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: f.actif ? "#10b98120" : "#ef444420" }]}>
                      <Text style={[s.statusText, { color: f.actif ? "#10b981" : "#ef4444" }]}>{f.actif ? "Active" : "Inactive"}</Text>
                    </View>
                  </View>
                  <View style={s.actionRow}>
                    <TouchableOpacity onPress={() => { setEditFormule(f); setFormulForm({ nom: f.nom, description: f.description || "", tarif: String(f.tarif), duree_jours: String(f.duree_jours) }); setShowAddFormule(true); }}
                      style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                      <Feather name="edit-2" size={13} color={colors.primary} />
                      <Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteFormule(f)}
                      style={[s.actionBtn, { backgroundColor: "#ef444415", borderColor: "#ef4444" }]}>
                      <Feather name="trash-2" size={13} color="#ef4444" />
                      <Text style={[s.actionText, { color: "#ef4444" }]}>Désactiver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            }

            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Abonnements membres ({abonnements.length})</Text>
            {abonnements.length === 0 ? <Empty icon="tag" text="Aucun abonnement affecté" /> :
              abonnements.slice(0, 30).map((a: any) => {
                const expire = new Date(a.date_fin) < new Date();
                return (
                  <View key={a.id_abonnement} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={s.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.title, { color: colors.foreground }]}>{a.prenom} {a.nom}</Text>
                        <Text style={[s.sub, { color: colors.primary }]}>{a.formule_nom} · {Number(a.tarif).toLocaleString()} DA</Text>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>
                          Du {a.date_debut?.slice(0,10)} au {a.date_fin?.slice(0,10)}
                        </Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: expire ? "#ef444420" : "#10b98120" }]}>
                        <Text style={[s.statusText, { color: expire ? "#ef4444" : "#10b981" }]}>{expire ? "Expiré" : "Actif"}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            }
          </>
        )}

        {/* ── ÉQUIPEMENTS ── */}
        {tab === "equipements" && (
          <>
            <EliteButton title="+ Ajouter un équipement" onPress={() => { setEditEquipement(null); setEquipForm({ nom: "", categorie: "Musculation", etat: "bon", quantite: "1", notes: "" }); setShowAddEquipement(true); }} variant="primary" small />
            {equipements.length === 0 ? <Empty icon="tool" text="Aucun équipement enregistré" /> :
              equipements.map((eq: any) => {
                const etatInfo = ETAT_INFO[eq.etat] || { label: eq.etat, color: "#6b7280" };
                return (
                  <View key={eq.id_equipement} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={s.cardRow}>
                      <View style={[s.avatar, { backgroundColor: etatInfo.color + "20" }]}>
                        <Feather name="tool" size={18} color={etatInfo.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.title, { color: colors.foreground }]}>{eq.nom}</Text>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>{eq.categorie} · Qté : {eq.quantite}</Text>
                        {eq.notes ? <Text style={[s.sub, { color: colors.mutedForeground }]}>{eq.notes}</Text> : null}
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: etatInfo.color + "20" }]}>
                        <Text style={[s.statusText, { color: etatInfo.color }]}>{etatInfo.label}</Text>
                      </View>
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity onPress={() => { setEditEquipement(eq); setEquipForm({ nom: eq.nom, categorie: eq.categorie, etat: eq.etat, quantite: String(eq.quantite), notes: eq.notes || "" }); setShowAddEquipement(true); }}
                        style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                        <Feather name="edit-2" size={13} color={colors.primary} />
                        <Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEquipement(eq)}
                        style={[s.actionBtn, { backgroundColor: "#ef444415", borderColor: "#ef4444" }]}>
                        <Feather name="trash-2" size={13} color="#ef4444" />
                        <Text style={[s.actionText, { color: "#ef4444" }]}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            }
          </>
        )}

        {/* ── AUDIT ── */}
        {tab === "audit" && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Journal d'audit ({audit.length} entrées)</Text>
            {audit.length === 0 ? <Empty icon="file-text" text="Aucune entrée d'audit" /> :
              audit.map((a: any) => (
                <View key={a.id_journal} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.title, { color: colors.foreground }]}>{a.action}</Text>
                  <Text style={[s.sub, { color: colors.mutedForeground }]}>
                    {a.prenom} {a.nom} · {new Date(a.date_action).toLocaleString("fr-FR")}
                  </Text>
                  {a.table_affectee && (
                    <Text style={[s.sub, { color: colors.primary }]}>Table : {a.table_affectee}</Text>
                  )}
                </View>
              ))
            }
          </>
        )}

        {/* ── PARAMÈTRES ── */}
        {tab === "parametres" && (
          <>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Informations du compte</Text>
              {[
                { icon: "user",   label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
                { icon: "shield", label: "Rôle",         value: user?.role },
                { icon: "mail",   label: "Email",         value: user?.email || "—" },
                { icon: "phone",  label: "Téléphone",     value: user?.telephone || "—" },
              ].map((item) => (
                <View key={item.label} style={[s.infoRow, { borderColor: colors.border }]}>
                  <Feather name={item.icon as any} size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sub, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[s.title, { color: colors.foreground, fontSize: 14 }]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
              <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
              <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
              <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loadingParam} variant="secondary" small />
            </View>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
              <Text style={[s.sub, { color: colors.mutedForeground }]}>Actuel : {user?.telephone || "—"}</Text>
              <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
              <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loadingParam} variant="secondary" small />
            </View>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Changer l'email</Text>
              <Text style={[s.sub, { color: colors.mutedForeground }]}>Actuel : {user?.email || "—"}</Text>
              <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="admin@elitegym.dz" keyboardType="email-address" autoCapitalize="none" />
              <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loadingParam} variant="secondary" small />
            </View>
            <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
          </>
        )}
      </ScrollView>

      {/* ── Modal : Ajouter membre ── */}
      <Modal visible={showAddMembre} animationType="slide" transparent onRequestClose={() => setShowAddMembre(false)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Nouveau membre</Text>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteInput label="Nom" value={newForm.nom} onChangeText={(v) => setNewForm({ ...newForm, nom: v })} /></View>
              <View style={{ flex: 1 }}><EliteInput label="Prénom" value={newForm.prenom} onChangeText={(v) => setNewForm({ ...newForm, prenom: v })} /></View>
            </View>
            <EliteInput label="Téléphone (optionnel)" value={newForm.telephone} onChangeText={(v) => setNewForm({ ...newForm, telephone: v })} keyboardType="phone-pad" placeholder="+213..." />
            <EliteInput label="Email (optionnel)" value={newForm.email} onChangeText={(v) => setNewForm({ ...newForm, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[s.sub, { color: colors.primary }]}>Mot de passe par défaut : <Text style={{ fontWeight: "900" }}>elitegym2026</Text></Text>
            </View>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddMembre(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Ajouter" onPress={handleAjouterMembre} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>

      {/* ── Modal : Ajouter coach ── */}
      <Modal visible={showAddCoach} animationType="slide" transparent onRequestClose={() => setShowAddCoach(false)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Nouveau coach</Text>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteInput label="Nom" value={newForm.nom} onChangeText={(v) => setNewForm({ ...newForm, nom: v })} /></View>
              <View style={{ flex: 1 }}><EliteInput label="Prénom" value={newForm.prenom} onChangeText={(v) => setNewForm({ ...newForm, prenom: v })} /></View>
            </View>
            <EliteInput label="Téléphone (optionnel)" value={newForm.telephone} onChangeText={(v) => setNewForm({ ...newForm, telephone: v })} keyboardType="phone-pad" placeholder="+213..." />
            <EliteInput label="Email (optionnel)" value={newForm.email} onChangeText={(v) => setNewForm({ ...newForm, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <EliteInput label="Spécialité" value={newForm.specialite} onChangeText={(v) => setNewForm({ ...newForm, specialite: v })} placeholder="ex: Musculation & Force" />
            <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[s.sub, { color: colors.primary }]}>Mot de passe par défaut : <Text style={{ fontWeight: "900" }}>elitegym2026</Text></Text>
            </View>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddCoach(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Ajouter" onPress={handleAjouterCoach} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>

      {/* ── Modal : Éditer membre/coach ── */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>
              Modifier {editTarget?.type === "membre" ? "le membre" : "le coach"}
            </Text>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteInput label="Nom" value={editForm.nom} onChangeText={(v) => setEditForm({ ...editForm, nom: v })} /></View>
              <View style={{ flex: 1 }}><EliteInput label="Prénom" value={editForm.prenom} onChangeText={(v) => setEditForm({ ...editForm, prenom: v })} /></View>
            </View>
            <EliteInput label="Téléphone" value={editForm.telephone} onChangeText={(v) => setEditForm({ ...editForm, telephone: v })} keyboardType="phone-pad" />
            <EliteInput label="Email" value={editForm.email} onChangeText={(v) => setEditForm({ ...editForm, email: v })} keyboardType="email-address" autoCapitalize="none" />
            {editTarget?.type === "coach" && (
              <EliteInput label="Spécialité" value={editForm.specialite} onChangeText={(v) => setEditForm({ ...editForm, specialite: v })} />
            )}
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setEditTarget(null)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Enregistrer" onPress={handleSaveEdit} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>

      {/* ── Modal : Enregistrer paiement ── */}
      <Modal visible={showAddPaiement} animationType="slide" transparent onRequestClose={() => setShowAddPaiement(false)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Enregistrer un paiement</Text>
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>Membre</Text>
            <ScrollView style={{ maxHeight: 160, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 10 }} nestedScrollEnabled>
              {membres.map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setPaiForm({ ...paiForm, id_membre: String(m.id_membre) })}
                  style={[s.selectItem, { backgroundColor: paiForm.id_membre === String(m.id_membre) ? colors.primary + "20" : "transparent", borderColor: colors.border }]}>
                  <Text style={{ color: colors.foreground }}>{m.prenom} {m.nom}</Text>
                  {paiForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EliteInput label="Montant (DA)" value={paiForm.montant} onChangeText={(v) => setPaiForm({ ...paiForm, montant: v })} keyboardType="numeric" placeholder="ex: 3000" />
            <EliteInput label="Motif" value={paiForm.motif} onChangeText={(v) => setPaiForm({ ...paiForm, motif: v })} placeholder="Abonnement, Inscription..." />
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>Mode de paiement</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {MODES_PAIEMENT.map((mode) => (
                <TouchableOpacity key={mode} onPress={() => setPaiForm({ ...paiForm, mode_paiement: mode })}
                  style={[s.modeBtn, { backgroundColor: paiForm.mode_paiement === mode ? colors.primary : colors.background, borderColor: paiForm.mode_paiement === mode ? colors.primary : colors.border }]}>
                  <Text style={{ color: paiForm.mode_paiement === mode ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddPaiement(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Enregistrer" onPress={handleAddPaiement} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>

      {/* ── Modal : Formule ── */}
      <Modal visible={showAddFormule} animationType="slide" transparent onRequestClose={() => setShowAddFormule(false)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>{editFormule ? "Modifier la formule" : "Nouvelle formule"}</Text>
            <EliteInput label="Nom" value={formulForm.nom} onChangeText={(v) => setFormulForm({ ...formulForm, nom: v })} placeholder="ex: Mensuel Standard" />
            <EliteInput label="Description (optionnel)" value={formulForm.description} onChangeText={(v) => setFormulForm({ ...formulForm, description: v })} />
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteInput label="Tarif (DA)" value={formulForm.tarif} onChangeText={(v) => setFormulForm({ ...formulForm, tarif: v })} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><EliteInput label="Durée (jours)" value={formulForm.duree_jours} onChangeText={(v) => setFormulForm({ ...formulForm, duree_jours: v })} keyboardType="numeric" /></View>
            </View>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => { setShowAddFormule(false); setEditFormule(null); }} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title={editFormule ? "Enregistrer" : "Créer"} onPress={handleSaveFormule} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>

      {/* ── Modal : Affecter abonnement ── */}
      <Modal visible={showAffecterAbo} animationType="slide" transparent onRequestClose={() => setShowAffecterAbo(false)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Affecter un abonnement</Text>
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>Membre</Text>
            <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 10 }} nestedScrollEnabled>
              {membres.map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setAboForm({ ...aboForm, id_membre: String(m.id_membre) })}
                  style={[s.selectItem, { backgroundColor: aboForm.id_membre === String(m.id_membre) ? colors.primary + "20" : "transparent", borderColor: colors.border }]}>
                  <Text style={{ color: colors.foreground }}>{m.prenom} {m.nom}</Text>
                  {aboForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>Formule</Text>
            <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 10 }} nestedScrollEnabled>
              {formules.filter((f: any) => f.actif).map((f: any) => (
                <TouchableOpacity key={f.id_formule} onPress={() => setAboForm({ ...aboForm, id_formule: String(f.id_formule) })}
                  style={[s.selectItem, { backgroundColor: aboForm.id_formule === String(f.id_formule) ? colors.primary + "20" : "transparent", borderColor: colors.border }]}>
                  <Text style={{ color: colors.foreground }}>{f.nom} · {Number(f.tarif).toLocaleString()} DA</Text>
                  {aboForm.id_formule === String(f.id_formule) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EliteInput label="Date début" value={aboForm.date_debut} onChangeText={(v) => setAboForm({ ...aboForm, date_debut: v })} placeholder="YYYY-MM-DD" />
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAffecterAbo(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Affecter" onPress={handleAffecterAbo} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>

      {/* ── Modal : Équipement ── */}
      <Modal visible={showAddEquipement} animationType="slide" transparent onRequestClose={() => setShowAddEquipement(false)}>
        <View style={s.overlay}>
          <ScrollView><View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>{editEquipement ? "Modifier l'équipement" : "Nouvel équipement"}</Text>
            <EliteInput label="Nom" value={equipForm.nom} onChangeText={(v) => setEquipForm({ ...equipForm, nom: v })} placeholder="ex: Tapis de course" />
            <EliteInput label="Catégorie" value={equipForm.categorie} onChangeText={(v) => setEquipForm({ ...equipForm, categorie: v })} placeholder="Musculation, Cardio, Boxe..." />
            <EliteInput label="Quantité" value={equipForm.quantite} onChangeText={(v) => setEquipForm({ ...equipForm, quantite: v })} keyboardType="numeric" />
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>État</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {Object.entries(ETAT_INFO).map(([key, info]) => (
                <TouchableOpacity key={key} onPress={() => setEquipForm({ ...equipForm, etat: key })}
                  style={[s.modeBtn, { backgroundColor: equipForm.etat === key ? info.color : colors.background, borderColor: equipForm.etat === key ? info.color : colors.border }]}>
                  <Text style={{ color: equipForm.etat === key ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>{info.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <EliteInput label="Notes (optionnel)" value={equipForm.notes} onChangeText={(v) => setEquipForm({ ...equipForm, notes: v })} placeholder="Observations, maintenance..." />
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => { setShowAddEquipement(false); setEditEquipement(null); }} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title={editEquipement ? "Enregistrer" : "Ajouter"} onPress={handleSaveEquipement} loading={loading} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  statCard: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
  tabBar: { borderBottomWidth: 1 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 11 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
  badgeDot: { position: "absolute", top: -5, right: -8, backgroundColor: "#E63946", borderRadius: 8, minWidth: 15, height: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  content: { padding: 14, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  title: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, paddingVertical: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: "700" },
  rowGap: { flexDirection: "row", gap: 10, alignItems: "center" },
  montant: { fontSize: 16, fontWeight: "800" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  infoBox: { borderRadius: 8, padding: 10, borderWidth: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, paddingVertical: 10 },
  selectItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  dashCard: { width: "47%", borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, alignItems: "center" },
  dashNum: { fontSize: 26, fontWeight: "900" },
  dashLabel: { fontSize: 11, textAlign: "center" },
  revCard: { borderRadius: 10, padding: 12, gap: 4, borderWidth: 1, alignItems: "center" },
  revNum: { fontSize: 18, fontWeight: "800" },
  revLabel: { fontSize: 11 },
});
