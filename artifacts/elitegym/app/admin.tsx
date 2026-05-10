import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Platform,
  Modal, TouchableOpacity, Alert, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNotifs } from "@/lib/notifications"; // ⚠️ Vérifie que ce chemin correspond à ton NotifContext
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"; // 👈 IMPORT ROUTER
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab = "dashboard"|"membres"|"coachs"|"planning"|"paiements"|"abonnements"|"equipements"|"audit"|"parametres";

const ETAT_INFO: Record<string, { label: string; color: string }> = {
  bon: { label: "Bon état", color: "#10b981" },
  usure: { label: "Usure", color: "#f59e0b" },
  maintenance: { label: "Maintenance", color: "#3b82f6" },
  hors_service: { label: "Hors service", color: "#ef4444" },
};
const STATUT_COLORS: Record<string, string> = {
  en_attente: "#f59e0b", publie: "#10b981", annule: "#ef4444", termine: "#6b7280",
};
const MODES_PAIEMENT = ["espèces","CIB","BaridiMob","virement","chèque"];
const JOURS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function Empty({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
      <Feather name={icon as any} size={30} color={colors.mutedForeground} />
      <Text style={[s.sub, { color: colors.mutedForeground, textAlign: "center" }]}>{text}</Text>
    </View>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const colors = useColors();
  return (
    <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={14} color={colors.mutedForeground} />
      <TextInput
        style={[s.searchInput, { color: colors.foreground }]}
        placeholder={placeholder || "Rechercher..."}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChange}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")}>
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function generatePdfHtml(p: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu</title>
<style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}
h1{color:#E63946;border-bottom:2px solid #E63946;padding-bottom:10px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
.label{color:#666}.value{font-weight:bold}.total{font-size:1.4em;color:#E63946}
.footer{margin-top:40px;text-align:center;color:#999;font-size:12px}
</style></head><body>
<h1>🏋️ Elite Gym — Reçu de paiement</h1>
<div class="row"><span class="label">N° Paiement</span><span class="value">#${p.id_paiement||"—"}</span></div>
<div class="row"><span class="label">Membre</span><span class="value">${p.prenom||""} ${p.nom||""}</span></div>
<div class="row"><span class="label">Date</span><span class="value">${new Date(p.date_heure||Date.now()).toLocaleString("fr-FR")}</span></div>
<div class="row"><span class="label">Motif</span><span class="value">${p.motif||"Abonnement"}${p.formule_nom?" — "+p.formule_nom:""}</span></div>
<div class="row"><span class="label">Mode</span><span class="value">${p.mode_paiement||"espèces"}</span></div>
<div class="row" style="margin-top:16px"><span class="label total">MONTANT</span><span class="value total">${Number(p.montant||0).toLocaleString()} DA</span></div>
<div class="footer">Elite Gym · Reçu généré le ${new Date().toLocaleString("fr-FR")}</div>
</body></html>`;
}

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuth(); // 👈 Ajout de isLoading
  const router = useRouter(); // 👈 Hook router
  const { notifs: wsNotifs, unread: unreadNotifs, markAllRead } = useNotifs();
  
  const [tab, setTab] = useState<Tab>("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  
  // ⚠️ NE PAS FAIRE : if (!user) return null; ici → ça bloque les useEffect
  // On gère la redirection dans le useEffect plus bas

  const [membres, setMembres] = useState<any[]>([]);
  const [coachs, setCoachs] = useState<any[]>([]);
  const [coursEnAttente, setCoursEnAttente] = useState<any[]>([]);
  const [allCours, setAllCours] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [formules, setFormules] = useState<any[]>([]);
  const [abonnements, setAbonnements] = useState<any[]>([]);
  const [equipements, setEquipements] = useState<any[]>([]);

  // Search
  const [searchMembre, setSearchMembre] = useState("");
  const [searchCoach, setSearchCoach] = useState("");
  const [searchAbo, setSearchAbo] = useState("");

  // Calendar
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showAddCours, setShowAddCours] = useState(false);
  const [coursForm, setCoursForm] = useState({ id_coach: "", type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });

  // Modals
  const [showAddMembre, setShowAddMembre] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [editTarget, setEditTarget] = useState<{ type: "membre"|"coach"; data: any }|null>(null);
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [showAddFormule, setShowAddFormule] = useState(false);
  const [editFormule, setEditFormule] = useState<any>(null);
  const [showAffecterAbo, setShowAffecterAbo] = useState(false);
  const [showAddEquipement, setShowAddEquipement] = useState(false);
  const [editEquipement, setEditEquipement] = useState<any>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Forms
  const [newForm, setNewForm] = useState({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
  const [paiForm, setPaiForm] = useState({ id_membre: "", montant: "", mode_paiement: "espèces", motif: "Abonnement", id_formule: "", date_paiement: new Date().toISOString().slice(0,10), notes: "" });
  const [formulForm, setFormulForm] = useState({ nom: "", description: "", tarif: "", duree_jours: "" });
  const [aboForm, setAboForm] = useState({ id_membre: "", id_formule: "", date_debut: new Date().toISOString().slice(0,10) });
  const [equipForm, setEquipForm] = useState({ nom: "", categorie: "Musculation", etat: "bon", quantite: "1", notes: "" });
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [nouvelEmail, setNouvelEmail] = useState("");
  const [loadingParam, setLoadingParam] = useState(false);


  // 🔧 Helper pour afficher les alertes de façon fiable sur Android/APK
const safeAlert = (title: string, message: string, onDismiss?: () => void) => {
  // Petit délai pour éviter les conflits avec la fermeture des modals
  setTimeout(() => {
    Alert.alert(title, message, [
      { 
        text: "OK", 
        onPress: () => {
          onDismiss?.();
        } 
      }
    ]);
  }, 100);
};

const safeConfirm = (
  title: string, 
  message: string, 
  onConfirm: () => Promise<void> | void,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
) => {
  const { confirmText = "Confirmer", cancelText = "Annuler", destructive = false } = options || {};
  
  setTimeout(() => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel" },
      { 
        text: confirmText, 
        style: destructive ? "destructive" : "default", 
        onPress: () => {
          Promise.resolve(onConfirm()).catch((err) => {
            console.error("❌ Erreur confirmation:", err);
            safeAlert("Erreur", err.message || "Une erreur est survenue");
          });
        } 
      },
    ]);
  }, 100);
};

  const load = async () => {
    try {
      const [m, c, p, a, st, cours, f, ab, eq, allC] = await Promise.all([
        api.get("/admin/membres"),
        api.get("/admin/coachs"),
        api.get("/admin/paiements"),
        api.get("/admin/audit"),
        api.get("/admin/stats").catch(() => ({})),
        api.get("/admin/cours-en-attente"),
        api.get("/admin/formules").catch(() => []),
        api.get("/admin/abonnements").catch(() => []),
        api.get("/admin/equipements").catch(() => []),
        api.get("/admin/cours").catch(() => []),
      ]);
      setMembres(m); setCoachs(c); setPaiements(p); setAudit(a);
      setStats(st); setCoursEnAttente(cours);
      setFormules(f); setAbonnements(ab); setEquipements(eq);
      setAllCours(allC); 
    } catch (err) {
      console.error("Erreur load:", err);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // 👇 PROTECTION DE ROUTE : Redirige vers login si pas authentifié
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Filtered
  const filteredMembres = membres.filter(m =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchMembre.toLowerCase()) ||
    (m.telephone || "").includes(searchMembre)
  );
  const filteredCoachs = coachs.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(searchCoach.toLowerCase()) ||
    (c.specialite || "").toLowerCase().includes(searchCoach.toLowerCase())
  );
  const filteredAbonnements = abonnements.filter(a =>
    `${a.prenom} ${a.nom}`.toLowerCase().includes(searchAbo.toLowerCase()) ||
    (a.formule_nom || "").toLowerCase().includes(searchAbo.toLowerCase())
  );

  // Calendar
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const coursMonth = allCours.filter(c => {
    const d = new Date(c.date_cours);
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });
  const coursForDay = (day: number) => coursMonth.filter(c => new Date(c.date_cours).getDate() === day);

  // Handlers membres
  // ✅ handleAjouterMembre - CORRIGÉ
const handleAjouterMembre = async () => {
  console.log("🔵 [DEBUG] handleAjouterMembre called");
  
  if (!newForm.nom || !newForm.prenom) { 
    safeAlert("Erreur", "Nom et prénom requis"); 
    return; 
  }
  if (!newForm.telephone && !newForm.email) { 
    safeAlert("Erreur", "Téléphone ou email requis"); 
    return; 
  }
  
  setLoading(true);
  try {
    console.log("🔵 [DEBUG] Appel API POST /admin/membres");
    await api.post("/admin/membres", { 
      nom: newForm.nom, 
      prenom: newForm.prenom, 
      telephone: newForm.telephone || undefined, 
      email: newForm.email || undefined 
    });
    
    console.log("🔵 [DEBUG] API succès, affichage alerte");
    safeAlert("Succès", "Membre ajouté\nMot de passe par défaut : elitegym2026", () => {
      console.log("🔵 [DEBUG] Alert dismissée, fermeture modal + reset");
      setShowAddMembre(false);
      setNewForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
      load();
    });
  } catch (e: any) { 
    console.error("❌ [ERREUR] handleAjouterMembre:", e);
    safeAlert("Erreur", e.message || "Erreur inconnue"); 
  } finally { 
    setLoading(false);
    console.log("🔵 [DEBUG] setLoading(false)");
  }
};

// ✅ handleAjouterCoach - MÊME STRUCTURE
const handleAjouterCoach = async () => {
  if (!newForm.nom || !newForm.prenom || !newForm.specialite) { 
    safeAlert("Erreur", "Nom, prénom et spécialité requis"); 
    return; 
  }
  if (!newForm.telephone && !newForm.email) { 
    safeAlert("Erreur", "Téléphone ou email requis"); 
    return; 
  }
  setLoading(true);
  try {
    await api.post("/admin/coachs", { 
      nom: newForm.nom, 
      prenom: newForm.prenom, 
      telephone: newForm.telephone || undefined, 
      email: newForm.email || undefined, 
      specialite: newForm.specialite 
    });
    safeAlert("Succès", "Coach ajouté\nMot de passe : elitegym2026", () => {
      setShowAddCoach(false);
      setNewForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleAjouterCoach:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};

// ✅ handleSaveEdit - CORRIGÉ
const handleSaveEdit = async () => {
  if (!editTarget) return;
  setLoading(true);
  try {
    if (editTarget.type === "membre") {
      await api.put(`/admin/membres/${editTarget.data.id_membre}`, editForm);
    } else {
      await api.put(`/admin/coachs/${editTarget.data.id_coach}`, editForm);
    }
    safeAlert("Succès", "Modifié ✓", () => {
      setEditTarget(null); 
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleSaveEdit:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};

// ✅ handleSuspendre - Utilise safeConfirm
const handleSuspendre = (type: "membre"|"coach", item: any) => {
  const actif = item.statut === 1;
  const action = actif ? "Suspendre" : "Réactiver";
  
  safeConfirm(
    `${action}`, 
    `${action} ${item.prenom} ${item.nom} ?`, 
    async () => {
      try {
        if (actif) {
          if (type === "membre") await api.delete(`/admin/membres/${item.id_membre}`);
          else await api.delete(`/admin/coachs/${item.id_coach}`);
        } else {
          if (type === "membre") await api.put(`/admin/membres/${item.id_membre}/activer`, {});
          else await api.put(`/admin/coachs/${item.id_coach}/activer`, {});
        }
        load();
      } catch (e: any) { 
        console.error("❌ Erreur handleSuspendre:", e);
        safeAlert("Erreur", e.message); 
      }
    },
    { confirmText: action, destructive: actif }
  );
};

// ✅ handleCreateCours - CORRIGÉ
const handleCreateCours = async () => {
  if (!coursForm.id_coach || !coursForm.type_cours || !coursForm.date_cours || !coursForm.heure_debut || !coursForm.salle) {
    safeAlert("Erreur", "Remplissez tous les champs obligatoires"); 
    return;
  }
  setLoading(true);
  try {
    await api.post("/admin/cours", { 
      ...coursForm, 
      id_coach: parseInt(coursForm.id_coach), 
      duree_minutes: parseInt(coursForm.duree_minutes)||60, 
      capacite_max: parseInt(coursForm.capacite_max)||20 
    });
    safeAlert("Succès", "Cours créé et publié ✓", () => {
      setShowAddCours(false);
      setCoursForm({ id_coach: "", type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleCreateCours:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};

// ✅ handleApprouver - Simple
const handleApprouver = async (id: number) => {
  try { 
    await api.put(`/admin/cours/${id}/approuver`); 
    safeAlert("Succès", "Approuvé ✓", load); 
  } catch (e: any) { 
    console.error("❌ Erreur handleApprouver:", e);
    safeAlert("Erreur", e.message); 
  }
};

// ✅ handleRejeter - Confirmation
const handleRejeter = async (id: number) => {
  safeConfirm("Rejeter ?", "Confirmer le rejet de ce cours ?", async () => {
    try { 
      await api.put(`/admin/cours/${id}/rejeter`); 
      load(); 
    } catch (e: any) { 
      console.error("❌ Erreur handleRejeter:", e);
      safeAlert("Erreur", e.message); 
    }
  });
};

// ✅ handleAddPaiement - CORRIGÉ
const handleAddPaiement = async () => {
  if (!paiForm.id_membre || !paiForm.montant) { 
    safeAlert("Erreur", "Sélectionnez un membre et entrez un montant"); 
    return; 
  }
  setLoading(true);
  try {
    await api.post("/admin/paiements", {
      ...paiForm,
      montant: parseFloat(paiForm.montant),
      id_formule: paiForm.id_formule ? parseInt(paiForm.id_formule) : undefined,
      date_heure: paiForm.date_paiement ? new Date(paiForm.date_paiement).toISOString() : undefined,
    });
    safeAlert("Succès", "Paiement enregistré ✓", () => {
      setShowAddPaiement(false);
      setPaiForm({ id_membre: "", montant: "", mode_paiement: "espèces", motif: "Abonnement", id_formule: "", date_paiement: new Date().toISOString().slice(0,10), notes: "" });
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleAddPaiement:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};
const handleExportPdf = (p: any) => {
  if (Platform.OS === "web") {
    const html = generatePdfHtml(p);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } else {
    // Sur mobile, on affiche l'alerte avec safeAlert
    safeAlert("Reçu PDF", `Reçu #${p.id_paiement} — ${Number(p.montant).toLocaleString()} DA\nDisponible sur la version web.`);
  }
};
// ✅ handleSaveFormule - CORRIGÉ
const handleSaveFormule = async () => {
  if (!formulForm.nom || !formulForm.tarif || !formulForm.duree_jours) { 
    safeAlert("Erreur", "Remplissez tous les champs"); 
    return; 
  }
  setLoading(true);
  try {
    const body = { ...formulForm, tarif: parseFloat(formulForm.tarif), duree_jours: parseInt(formulForm.duree_jours) };
    if (editFormule) {
      await api.put(`/admin/formules/${editFormule.id_formule}`, { ...editFormule, ...body });
    } else {
      await api.post("/admin/formules", body);
    }
    safeAlert("Succès", editFormule ? "Formule modifiée ✓" : "Formule créée ✓", () => {
      setShowAddFormule(false); 
      setEditFormule(null);
      setFormulForm({ nom: "", description: "", tarif: "", duree_jours: "" });
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleSaveFormule:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};

// ✅ handleToggleFormule - Confirmation
const handleToggleFormule = (f: any) => {
  const action = f.actif ? "Désactiver" : "Activer";
  safeConfirm(action, `${action} "${f.nom}" ?`, async () => {
    try { 
      await api.put(`/admin/formules/${f.id_formule}/toggle`, {}); 
      load(); 
    } catch (e: any) { 
      console.error("❌ Erreur handleToggleFormule:", e);
      safeAlert("Erreur", e.message); 
    }
  });
};

// ✅ handleAffecterAbo - CORRIGÉ
const handleAffecterAbo = async () => {
  if (!aboForm.id_membre || !aboForm.id_formule) { 
    safeAlert("Erreur", "Sélectionnez un membre et une formule"); 
    return; 
  }
  setLoading(true);
  try {
    await api.post("/admin/abonnements", { 
      ...aboForm, 
      id_membre: parseInt(aboForm.id_membre), 
      id_formule: parseInt(aboForm.id_formule) 
    });
    safeAlert("Succès", "Abonnement affecté ✓", () => {
      setShowAffecterAbo(false);
      setAboForm({ id_membre: "", id_formule: "", date_debut: new Date().toISOString().slice(0,10) });
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleAffecterAbo:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};

// ✅ handleResilierAbo - Confirmation
const handleResilierAbo = (a: any) => {
  safeConfirm("Résilier", `Résilier l'abonnement de ${a.prenom} ${a.nom} ?`, async () => {
    try { 
      await api.put(`/admin/abonnements/${a.id_abonnement}/resilier`, {}); 
      load(); 
    } catch (e: any) { 
      console.error("❌ Erreur handleResilierAbo:", e);
      safeAlert("Erreur", e.message); 
    }
  });
};

// ✅ handleSaveEquipement - CORRIGÉ
const handleSaveEquipement = async () => {
  if (!equipForm.nom) { 
    safeAlert("Erreur", "Entrez un nom"); 
    return; 
  }
  setLoading(true);
  try {
    const body = { ...equipForm, quantite: parseInt(equipForm.quantite) || 1 };
    if (editEquipement) {
      await api.put(`/admin/equipements/${editEquipement.id_equipement}`, body);
    } else {
      await api.post("/admin/equipements", body);
    }
    safeAlert("Succès", editEquipement ? "Modifié ✓" : "Ajouté ✓", () => {
      setShowAddEquipement(false); 
      setEditEquipement(null);
      setEquipForm({ nom: "", categorie: "Musculation", etat: "bon", quantite: "1", notes: "" });
      load();
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleSaveEquipement:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoading(false); 
  }
};

// ✅ handleDeleteEquipement - Confirmation
const handleDeleteEquipement = (eq: any) => {
  safeConfirm("Supprimer", `Supprimer "${eq.nom}" ?`, async () => {
    try { 
      await api.delete(`/admin/equipements/${eq.id_equipement}`); 
      load(); 
    } catch (e: any) { 
      console.error("❌ Erreur handleDeleteEquipement:", e);
      safeAlert("Erreur", e.message); 
    }
  });
};

// ✅ handleBackup - Simple
const handleBackup = async () => {
  setBackupLoading(true);
  try {
    const r = await api.post("/admin/backup", { id_util: user?.id });
    safeAlert("Sauvegarde ✓", `${new Date(r.timestamp).toLocaleString("fr-FR")}\n${r.stats.membres} membres · ${r.stats.paiements} paiements`, load);
  } catch (e: any) { 
    console.error("❌ Erreur handleBackup:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setBackupLoading(false); 
  }
};

// ✅ handleChangeMdp/Tel/Email - Simples
const handleChangeMdp = async () => {
  if (!ancienMdp || !nouveauMdp || nouveauMdp.length < 6) { 
    safeAlert("Erreur", "Vérifiez les champs (min 6 car.)"); 
    return; 
  }
  setLoadingParam(true);
  try {
    await api.post("/auth/change-password", { id_util: user?.id, ancien_mdp: ancienMdp, nouveau_mdp: nouveauMdp });
    safeAlert("Succès", "Mot de passe modifié ✓", () => {
      setAncienMdp(""); 
      setNouveauMdp("");
    });
  } catch (e: any) { 
    console.error("❌ Erreur handleChangeMdp:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoadingParam(false); 
  }
};

const handleChangeTel = async () => {
  if (!nouveauTel) return;
  setLoadingParam(true);
  try { 
    await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel }); 
    safeAlert("Succès", "Numéro modifié ✓", () => setNouveauTel("")); 
  } catch (e: any) { 
    console.error("❌ Erreur handleChangeTel:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoadingParam(false); 
  }
};

const handleChangeEmail = async () => {
  if (!nouvelEmail) return;
  setLoadingParam(true);
  try { 
    await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail }); 
    safeAlert("Succès", "Email modifié ✓", () => setNouvelEmail("")); 
  } catch (e: any) { 
    console.error("❌ Erreur handleChangeEmail:", e);
    safeAlert("Erreur", e.message); 
  } finally { 
    setLoadingParam(false); 
  }
};
  const handleLogout = async () => {
  console.log("🔴 [LOGOUT] handleLogout called, platform:", Platform.OS);
  
  if (Platform.OS === "web") {
    // Sur web, Alert.alert ne marche pas → utiliser window.confirm
    const confirmed = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
    console.log("🔴 [LOGOUT] web confirm result:", confirmed);
    if (!confirmed) return;
    
    console.log("🔴 [LOGOUT] Calling logout()...");
    await logout();
    console.log("🔴 [LOGOUT] logout() done, redirecting...");
    window.location.href = "/login";
    return;
  }

  // Mobile uniquement
  Alert.alert(
    "Déconnexion",
    "Êtes-vous sûr de vouloir vous déconnecter ?",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          console.log("🔴 [LOGOUT] Mobile confirmed");
          await logout();
          router.replace("/login");
        },
      },
    ]
  );
};
  const TABS: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "dashboard",   label: "Tableau",     icon: "bar-chart-2" },
    { key: "membres",     label: "Membres",     icon: "users" },
    { key: "coachs",      label: "Coachs",      icon: "activity" },
    { key: "planning",    label: "Planning",    icon: "calendar", badge: coursEnAttente.length },
    { key: "paiements",   label: "Paiements",   icon: "credit-card" },
    { key: "abonnements", label: "Abonnements", icon: "tag" },
    { key: "equipements", label: "Équipements", icon: "tool" },
    { key: "audit",       label: "Audit",       icon: "file-text" },
    { key: "parametres",  label: "Paramètres",  icon: "settings" },
  ];

  const aboActifs = abonnements.filter((a: any) => a.statut === "actif" && new Date(a.date_fin) >= new Date());
  const revenuMois = stats.revenu_mois ? Number(stats.revenu_mois).toLocaleString() : "—";
  const revenuTotal = stats.revenu_total ? Number(stats.revenu_total).toLocaleString() : "—";
  
  // 👇 Affichage conditionnel pendant le chargement initial
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.foreground }}>Chargement...</Text>
      </View>
    );
  }

  // 👇 Si pas de user après chargement, on n'affiche rien (le useEffect redirigera)
  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
        <View style={s.headerAvatar}>
          <Text style={s.headerAvatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{user?.prenom} {user?.nom}</Text>
          <Text style={s.headerSub}>Administrateur</Text>
        </View>
        <TouchableOpacity onPress={() => { setShowNotifs(true); markAllRead(); }} style={{ marginRight: 14, position: "relative" }}>
          <Feather name="bell" size={22} color="rgba(255,255,255,0.9)" />
          {unreadNotifs > 0 && (
            <View style={s.notifBadge}><Text style={s.notifBadgeText}>{unreadNotifs}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label: "Membres",    value: membres.filter((m: any) => m.statut === 1).length, color: colors.primary },
          { label: "Coachs",     value: coachs.filter((c: any) => c.statut === 1).length,  color: "#10b981" },
          { label: "En att.",    value: coursEnAttente.length,                              color: "#f59e0b" },
          { label: "Abo actifs", value: aboActifs.length,                                  color: "#8b5cf6" },
        ].map((st) => (
          <View key={st.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: st.color }]}>{st.value}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <View style={[s.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Supervision globale</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {[
                  { icon: "users",    label: "Membres actifs",     value: membres.filter((m: any) => m.statut === 1).length, color: colors.primary },
                  { icon: "activity", label: "Coachs actifs",      value: coachs.filter((c: any) => c.statut === 1).length,  color: "#10b981" },
                  { icon: "tag",      label: "Abonnements actifs", value: aboActifs.length,                                   color: "#8b5cf6" },
                  { icon: "check-circle", label: "Cours publiés",  value: stats.cours_publies ?? "—",                        color: "#3b82f6" },
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
                  <Text style={[s.revLabel, { color: colors.mutedForeground }]}>Total</Text>
                </View>
              </View>
              {stats.revenu_mensuel?.length > 0 && (
                <View style={{ marginTop: 10, gap: 4 }}>
                  <Text style={[s.sub, { color: colors.mutedForeground, fontWeight: "600" }]}>6 derniers mois</Text>
                  {stats.revenu_mensuel.map((rm: any) => (
                    <View key={rm.mois} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[s.sub, { color: colors.mutedForeground, width: 60 }]}>{rm.mois}</Text>
                      <View style={{ flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: "hidden" }}>
                        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.primary, width: `${Math.min(100, (rm.total / (Math.max(...stats.revenu_mensuel.map((x: any) => x.total)) || 1)) * 100)}%` }} />
                      </View>
                      <Text style={[s.sub, { color: colors.foreground, fontWeight: "700", width: 80, textAlign: "right" }]}>{Number(rm.total).toLocaleString()} DA</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <EliteButton title={backupLoading ? "Sauvegarde..." : "Lancer une sauvegarde"} onPress={handleBackup} loading={backupLoading} variant="secondary" />
          </>
        )}

        {/* MEMBRES */}
        {tab === "membres" && (
          <>
            <EliteButton title="+ Ajouter un membre" onPress={() => { setNewForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" }); setShowAddMembre(true); }} variant="primary" small />
            <SearchBar value={searchMembre} onChange={setSearchMembre} placeholder="Rechercher par nom, téléphone..." />
            {filteredMembres.length === 0 ? <Empty icon="users" text="Aucun membre trouvé" /> :
              filteredMembres.map((m: any) => {
                const actif = m.statut === 1;
                return (
                  <View key={m.id_membre} style={[s.card, { backgroundColor: colors.card, borderColor: actif ? colors.border : "#ef444430", borderWidth: actif ? 1 : 1.5 }]}>
                    <View style={s.cardRow}>
                      <View style={[s.avatar, { backgroundColor: (actif ? colors.primary : "#ef4444") + "20" }]}>
                        <Text style={[s.avatarText, { color: actif ? colors.primary : "#ef4444" }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[s.title, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                          {!actif && <View style={[s.statusBadge, { backgroundColor: "#ef444420" }]}><Text style={[s.statusText, { color: "#ef4444" }]}>Suspendu</Text></View>}
                        </View>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>{m.telephone || m.email || "—"}</Text>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>#{m.id_membre} · {m.date_inscription?.slice(0,10)}</Text>
                      </View>
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity onPress={() => openEditMembre(m)} style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                        <Feather name="edit-2" size={13} color={colors.primary} />
                        <Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleSuspendre("membre", m)}
                        style={[s.actionBtn, { backgroundColor: (actif ? "#f59e0b" : "#10b981") + "15", borderColor: actif ? "#f59e0b" : "#10b981" }]}>
                        <Feather name={actif ? "user-x" : "user-check"} size={13} color={actif ? "#f59e0b" : "#10b981"} />
                        <Text style={[s.actionText, { color: actif ? "#f59e0b" : "#10b981" }]}>{actif ? "Suspendre" : "Réactiver"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            }
          </>
        )}

        {/* COACHS */}
        {tab === "coachs" && (
          <>
            <EliteButton title="+ Ajouter un coach" onPress={() => { setNewForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" }); setShowAddCoach(true); }} variant="primary" small />
            <SearchBar value={searchCoach} onChange={setSearchCoach} placeholder="Rechercher par nom, spécialité..." />
            {filteredCoachs.length === 0 ? <Empty icon="activity" text="Aucun coach trouvé" /> :
              filteredCoachs.map((c: any) => {
                const actif = c.statut === 1;
                return (
                  <View key={c.id_coach} style={[s.card, { backgroundColor: colors.card, borderColor: actif ? colors.border : "#ef444430", borderWidth: actif ? 1 : 1.5 }]}>
                    <View style={s.cardRow}>
                      <View style={[s.avatar, { backgroundColor: (actif ? "#10b981" : "#ef4444") + "20" }]}>
                        <Text style={[s.avatarText, { color: actif ? "#10b981" : "#ef4444" }]}>{c.prenom?.[0]}{c.nom?.[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[s.title, { color: colors.foreground }]}>{c.prenom} {c.nom}</Text>
                          {!actif && <View style={[s.statusBadge, { backgroundColor: "#ef444420" }]}><Text style={[s.statusText, { color: "#ef4444" }]}>Suspendu</Text></View>}
                        </View>
                        <Text style={[s.sub, { color: colors.primary }]}>{c.specialite}</Text>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>#{c.id_coach} · {c.telephone || c.email || "—"}</Text>
                      </View>
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity onPress={() => openEditCoach(c)} style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                        <Feather name="edit-2" size={13} color={colors.primary} />
                        <Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleSuspendre("coach", c)}
                        style={[s.actionBtn, { backgroundColor: (actif ? "#f59e0b" : "#10b981") + "15", borderColor: actif ? "#f59e0b" : "#10b981" }]}>
                        <Feather name={actif ? "user-x" : "user-check"} size={13} color={actif ? "#f59e0b" : "#10b981"} />
                        <Text style={[s.actionText, { color: actif ? "#f59e0b" : "#10b981" }]}>{actif ? "Suspendre" : "Réactiver"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            }
          </>
        )}

        {/* PLANNING CALENDRIER */}
        {tab === "planning" && (
          <>
            {coursEnAttente.length > 0 && (
              <View style={[s.card, { backgroundColor: "#f59e0b08", borderColor: "#f59e0b40", borderWidth: 1.5 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Feather name="clock" size={15} color="#f59e0b" />
                  <Text style={[s.sectionTitle, { color: "#b45309", marginBottom: 0 }]}>{coursEnAttente.length} cours en attente</Text>
                </View>
                {coursEnAttente.map((c: any) => (
                  <View key={c.id_cours} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.title, { color: colors.foreground }]}>{c.type_cours}</Text>
                    <Text style={[s.sub, { color: colors.primary }]}>Coach : {c.prenom} {c.nom}</Text>
                    <Text style={[s.sub, { color: colors.mutedForeground }]}>📅 {c.date_cours?.slice(0,10)} · {c.heure_debut?.slice(0,5)} · {c.duree_minutes} min · {c.salle}</Text>
                    <View style={s.actionRow}>
                      <TouchableOpacity onPress={() => handleRejeter(c.id_cours)} style={[s.actionBtn, { backgroundColor: "#ef444420", borderColor: "#ef4444" }]}>
                        <Feather name="x" size={13} color="#ef4444" /><Text style={[s.actionText, { color: "#ef4444" }]}>Rejeter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleApprouver(c.id_cours)} style={[s.actionBtn, { backgroundColor: "#10b98120", borderColor: "#10b981", flex: 2 }]}>
                        <Feather name="check" size={13} color="#10b981" /><Text style={[s.actionText, { color: "#10b981" }]}>Approuver</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <EliteButton title="+ Créer un cours pour un coach" onPress={() => setShowAddCours(true)} variant="primary" small />

            {/* Calendrier */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <TouchableOpacity onPress={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} style={{ padding: 8 }}>
                  <Feather name="chevron-left" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>{MOIS_FR[calMonth]} {calYear}</Text>
                <TouchableOpacity onPress={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))} style={{ padding: 8 }}>
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                {JOURS_FR.map((j) => (
                  <View key={j} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700" }}>{j}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`e${i}`} style={s.calCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const today = new Date();
                  const isToday = today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear;
                  const dayEvents = coursForDay(day);
                  return (
                    <View key={day} style={[s.calCell, isToday && { backgroundColor: colors.primary + "15", borderRadius: 6, borderWidth: 1, borderColor: colors.primary }]}>
                      <Text style={{ fontSize: 11, textAlign: "center", fontWeight: isToday ? "800" : "400", color: isToday ? colors.primary : colors.foreground }}>{day}</Text>
                      {dayEvents.slice(0, 2).map((e: any, idx: number) => (
                        <View key={idx} style={[s.calEvent, { backgroundColor: e.statut === "publie" ? colors.primary : "#f59e0b" }]}>
                          <Text numberOfLines={1} style={{ color: "#fff", fontSize: 8, fontWeight: "700" }}>{e.type_cours}</Text>
                        </View>
                      ))}
                      {dayEvents.length > 2 && <Text style={{ fontSize: 8, color: colors.mutedForeground, textAlign: "center" }}>+{dayEvents.length - 2}</Text>}
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                {[{ color: colors.primary, label: "Publié" }, { color: "#f59e0b", label: "En attente" }].map(l => (
                  <View key={l.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
                    <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {coursMonth.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Cours de {MOIS_FR[calMonth]} ({coursMonth.length})</Text>
                {[...coursMonth].sort((a, b) => a.date_cours.localeCompare(b.date_cours)).map((c: any) => (
                  <View key={c.id_cours} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.title, { color: colors.foreground }]}>{c.type_cours}</Text>
                        <Text style={[s.sub, { color: colors.primary }]}>Coach : {c.prenom} {c.nom}</Text>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>📅 {c.date_cours?.slice(0,10)} · {c.heure_debut?.slice(0,5)} · {c.duree_minutes} min</Text>
                        <Text style={[s.sub, { color: colors.mutedForeground }]}>🏠 {c.salle} · {c.places_restantes}/{c.capacite_max} places</Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: (STATUT_COLORS[c.statut] || "#6b7280") + "20" }]}>
                        <Text style={[s.statusText, { color: STATUT_COLORS[c.statut] || "#6b7280" }]}>{c.statut}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* PAIEMENTS */}
        {tab === "paiements" && (
          <>
            <EliteButton title="+ Enregistrer un paiement" onPress={() => setShowAddPaiement(true)} variant="primary" small />
            {paiements.length === 0 ? <Empty icon="credit-card" text="Aucun paiement" /> :
              paiements.map((p: any) => (
                <View key={p.id_paiement} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{p.prenom} {p.nom}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>{p.motif}{p.formule_nom ? ` · ${p.formule_nom}` : ""}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>{new Date(p.date_heure).toLocaleDateString("fr-FR")} · {p.mode_paiement}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <Text style={[s.montant, { color: "#10b981" }]}>{Number(p.montant).toLocaleString()} DA</Text>
                      <TouchableOpacity onPress={() => handleExportPdf(p)} style={[s.actionBtn, { backgroundColor: "#3b82f615", borderColor: "#3b82f6", paddingHorizontal: 10 }]}>
                        <Feather name="file-text" size={12} color="#3b82f6" />
                        <Text style={[s.actionText, { color: "#3b82f6" }]}>PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            }
          </>
        )}

        {/* ABONNEMENTS */}
        {tab === "abonnements" && (
          <>
            <View style={s.rowGap}>
              <View style={{ flex: 1 }}><EliteButton title="+ Affecter abo" onPress={() => setShowAffecterAbo(true)} variant="primary" small /></View>
              <View style={{ flex: 1 }}><EliteButton title="+ Formule" onPress={() => { setEditFormule(null); setFormulForm({ nom: "", description: "", tarif: "", duree_jours: "" }); setShowAddFormule(true); }} variant="secondary" small /></View>
            </View>
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Formules d'abonnement</Text>
            {formules.map((f: any) => (
              <View key={f.id_formule} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.title, { color: colors.foreground }]}>{f.nom}</Text>
                    {f.description ? <Text style={[s.sub, { color: colors.mutedForeground }]}>{f.description}</Text> : null}
                    <Text style={[s.sub, { color: colors.primary, fontWeight: "700" }]}>{Number(f.tarif).toLocaleString()} DA · {f.duree_jours} jours</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: (f.actif ? "#10b981" : "#ef4444") + "20" }]}>
                    <Text style={[s.statusText, { color: f.actif ? "#10b981" : "#ef4444" }]}>{f.actif ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
                <View style={s.actionRow}>
                  <TouchableOpacity onPress={() => { setEditFormule(f); setFormulForm({ nom: f.nom, description: f.description || "", tarif: String(f.tarif), duree_jours: String(f.duree_jours) }); setShowAddFormule(true); }}
                    style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                    <Feather name="edit-2" size={13} color={colors.primary} /><Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleToggleFormule(f)}
                    style={[s.actionBtn, { backgroundColor: (f.actif ? "#f59e0b" : "#10b981") + "15", borderColor: f.actif ? "#f59e0b" : "#10b981" }]}>
                    <Feather name={f.actif ? "toggle-right" : "toggle-left"} size={13} color={f.actif ? "#f59e0b" : "#10b981"} />
                    <Text style={[s.actionText, { color: f.actif ? "#f59e0b" : "#10b981" }]}>{f.actif ? "Désactiver" : "Activer"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Abonnements membres</Text>
            <SearchBar value={searchAbo} onChange={setSearchAbo} placeholder="Rechercher membre ou formule..." />
            {filteredAbonnements.slice(0,50).map((a: any) => {
              const expire = new Date(a.date_fin) < new Date();
              const resilié = a.statut === "resilié";
              const statusColor = resilié ? "#6b7280" : expire ? "#ef4444" : "#10b981";
              return (
                <View key={a.id_abonnement} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{a.prenom} {a.nom}</Text>
                      <Text style={[s.sub, { color: colors.primary }]}>{a.formule_nom} · {Number(a.tarif).toLocaleString()} DA</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>{a.date_debut?.slice(0,10)} → {a.date_fin?.slice(0,10)}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusColor + "20" }]}>
                      <Text style={[s.statusText, { color: statusColor }]}>{resilié ? "Résilié" : expire ? "Expiré" : "Actif"}</Text>
                    </View>
                  </View>
                  {!resilié && (
                    <TouchableOpacity onPress={() => handleResilierAbo(a)}
                      style={[s.actionBtn, { backgroundColor: "#ef444415", borderColor: "#ef4444", alignSelf: "flex-end" }]}>
                      <Feather name="x-circle" size={13} color="#ef4444" /><Text style={[s.actionText, { color: "#ef4444" }]}>Résilier</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* ÉQUIPEMENTS */}
        {tab === "equipements" && (
          <>
            <EliteButton title="+ Ajouter un équipement" onPress={() => { setEditEquipement(null); setEquipForm({ nom: "", categorie: "Musculation", etat: "bon", quantite: "1", notes: "" }); setShowAddEquipement(true); }} variant="primary" small />
            {equipements.map((eq: any) => {
              const info = ETAT_INFO[eq.etat] || { label: eq.etat, color: "#6b7280" };
              return (
                <View key={eq.id_equipement} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.cardRow}>
                    <View style={[s.avatar, { backgroundColor: info.color + "20" }]}><Feather name="tool" size={18} color={info.color} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.title, { color: colors.foreground }]}>{eq.nom}</Text>
                      <Text style={[s.sub, { color: colors.mutedForeground }]}>{eq.categorie} · Qté : {eq.quantite}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: info.color + "20" }]}><Text style={[s.statusText, { color: info.color }]}>{info.label}</Text></View>
                  </View>
                  <View style={s.actionRow}>
                    <TouchableOpacity onPress={() => { setEditEquipement(eq); setEquipForm({ nom: eq.nom, categorie: eq.categorie, etat: eq.etat, quantite: String(eq.quantite), notes: eq.notes || "" }); setShowAddEquipement(true); }}
                      style={[s.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                      <Feather name="edit-2" size={13} color={colors.primary} /><Text style={[s.actionText, { color: colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteEquipement(eq)} style={[s.actionBtn, { backgroundColor: "#ef444415", borderColor: "#ef4444" }]}>
                      <Feather name="trash-2" size={13} color="#ef4444" /><Text style={[s.actionText, { color: "#ef4444" }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* AUDIT */}
        {tab === "audit" && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Journal ({audit.length})</Text>
            {audit.map((a: any) => (
              <View key={a.id_journal} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.title, { color: colors.foreground }]}>{a.action}</Text>
                <Text style={[s.sub, { color: colors.mutedForeground }]}>{a.prenom} {a.nom} · {new Date(a.date_action).toLocaleString("fr-FR")}</Text>
                {a.table_affectee && <Text style={[s.sub, { color: colors.primary }]}>Table : {a.table_affectee}</Text>}
              </View>
            ))}
          </>
        )}

        {/* PARAMÈTRES */}
        {tab === "parametres" && (
          <>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Compte</Text>
              {[
                { icon: "user",   label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
                { icon: "mail",   label: "Email",        value: user?.email || "—" },
                { icon: "phone",  label: "Téléphone",    value: user?.telephone || "—" },
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
              <EliteInput label="Ancien" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
              <EliteInput label="Nouveau" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
              <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loadingParam} variant="secondary" small />
            </View>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
              <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
              <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loadingParam} variant="secondary" small />
            </View>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Changer l'email</Text>
              <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="admin@elitegym.dz" keyboardType="email-address" autoCapitalize="none" />
              <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loadingParam} variant="secondary" small />
            </View>
            {/* 🔥 CORRECTION ICI : onPress={handleLogout} */}
            <EliteButton title="Se déconnecter" onPress={handleLogout} variant="danger" />
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Nav Bar */}
      <View style={[s.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bottomBarInner}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={s.bottomTabBtn}>
              <View style={{ position: "relative" }}>
                <Feather name={t.icon as any} size={20} color={tab === t.key ? colors.primary : colors.mutedForeground} />
                {t.badge && t.badge > 0 ? (
                  <View style={s.badgeDot}><Text style={s.badgeText}>{t.badge}</Text></View>
                ) : null}
              </View>
              <Text style={[s.bottomTabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal Notifications */}
      <Modal visible={showNotifs} animationType="slide" transparent onRequestClose={() => setShowNotifs(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { backgroundColor: colors.card, maxHeight: "80%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifs(false)}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
            </View>
            <ScrollView>
              {wsNotifs.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
                  <Feather name="bell" size={28} color={colors.mutedForeground} />
                  <Text style={[s.title, { color: colors.foreground }]}>Aucune notification</Text>
                </View>
              ) : wsNotifs.map((n) => {
                const ADMIN_META: Record<string, {icon: string; color: string}> = {
                  paiement: {icon:"dollar-sign",color:"#10b981"}, membre:{icon:"user-plus",color:"#3b82f6"},
                  abonnement:{icon:"alert-circle",color:"#ef4444"}, cours:{icon:"calendar",color:"#f59e0b"},
                  renouvellement:{icon:"refresh-cw",color:"#8b5cf6"}, backup:{icon:"save",color:"#0ea5e9"},
                  alerte:{icon:"alert-triangle",color:"#ef4444"},
                };
                const metaKey = Object.keys(ADMIN_META).find(k => n.type_notif?.includes(k) || n.contenu?.toLowerCase().includes(k));
                const meta = metaKey ? ADMIN_META[metaKey] : {icon:"bell",color:"#6b7280"};
                const typeIcon: Record<string, string> = {
                  cours_approuve: "✅", cours_rejete: "❌", nouveau_cours: "📅",
                  paiement: "💳", abonnement: "🏷️", presence: "📊", message: "💬",
                  nouveau_membre: "👤", backup: "💾", equipement: "🔧",
                };
                const typeColor: Record<string, string> = {
                  cours_approuve: "#10b981", cours_rejete: "#ef4444", nouveau_cours: "#3b82f6",
                  paiement: "#8b5cf6", abonnement: "#f59e0b", presence: "#06b6d4",
                  message: "#ec4899", nouveau_membre: "#10b981", backup: "#6b7280", equipement: "#f59e0b",
                };
                const icon = typeIcon[n.type] || "🔔";
                const color = typeColor[n.type] || colors.primary;
                return (
                  <View key={n.id_notif} style={[s.card, { backgroundColor: n.lu ? colors.background : colors.primary + "10", borderColor: n.lu ? colors.border : colors.primary + "40" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <Text style={{ fontSize: 16 }}>{icon}</Text>
                      <Text style={[s.title, { color, fontSize: 13, flex: 1 }]}>{n.titre}</Text>
                      {!n.lu && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />}
                    </View>
                    {n.message && <Text style={[s.sub, { color: colors.mutedForeground }]}>{n.message}</Text>}
                    <Text style={[s.sub, { color: colors.mutedForeground }]}>{new Date(n.date_creation).toLocaleString("fr-FR")}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Ajouter un membre */}
      <Modal visible={showAddMembre} animationType="slide" transparent onRequestClose={() => setShowAddMembre(false)}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Ajouter un membre</Text>
            <EliteInput label="Prénom *" value={newForm.prenom} onChangeText={(v) => setNewForm({ ...newForm, prenom: v })} placeholder="Prénom" />
            <EliteInput label="Nom *" value={newForm.nom} onChangeText={(v) => setNewForm({ ...newForm, nom: v })} placeholder="Nom" />
            <EliteInput label="Téléphone" value={newForm.telephone} onChangeText={(v) => setNewForm({ ...newForm, telephone: v })} placeholder="+213..." keyboardType="phone-pad" />
            <EliteInput label="Email" value={newForm.email} onChangeText={(v) => setNewForm({ ...newForm, email: v })} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddMembre(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Ajouter" onPress={handleAjouterMembre} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Ajouter un coach */}
      <Modal visible={showAddCoach} animationType="slide" transparent onRequestClose={() => setShowAddCoach(false)}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Ajouter un coach</Text>
            <EliteInput label="Prénom *" value={newForm.prenom} onChangeText={(v) => setNewForm({ ...newForm, prenom: v })} placeholder="Prénom" />
            <EliteInput label="Nom *" value={newForm.nom} onChangeText={(v) => setNewForm({ ...newForm, nom: v })} placeholder="Nom" />
            <EliteInput label="Spécialité *" value={newForm.specialite} onChangeText={(v) => setNewForm({ ...newForm, specialite: v })} placeholder="ex: Musculation, Yoga..." />
            <EliteInput label="Téléphone" value={newForm.telephone} onChangeText={(v) => setNewForm({ ...newForm, telephone: v })} placeholder="+213..." keyboardType="phone-pad" />
            <EliteInput label="Email" value={newForm.email} onChangeText={(v) => setNewForm({ ...newForm, email: v })} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddCoach(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Ajouter" onPress={handleAjouterCoach} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Modifier membre/coach */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>
              Modifier {editTarget?.type === "membre" ? "le membre" : "le coach"}
            </Text>
            <EliteInput label="Prénom" value={editForm.prenom} onChangeText={(v) => setEditForm({ ...editForm, prenom: v })} placeholder="Prénom" />
            <EliteInput label="Nom" value={editForm.nom} onChangeText={(v) => setEditForm({ ...editForm, nom: v })} placeholder="Nom" />
            {editTarget?.type === "coach" && (
              <EliteInput label="Spécialité" value={editForm.specialite} onChangeText={(v) => setEditForm({ ...editForm, specialite: v })} placeholder="Spécialité" />
            )}
            <EliteInput label="Téléphone" value={editForm.telephone} onChangeText={(v) => setEditForm({ ...editForm, telephone: v })} placeholder="+213..." keyboardType="phone-pad" />
            <EliteInput label="Email" value={editForm.email} onChangeText={(v) => setEditForm({ ...editForm, email: v })} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setEditTarget(null)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Enregistrer" onPress={handleSaveEdit} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Créer un cours */}
      <Modal visible={showAddCours} animationType="slide" transparent onRequestClose={() => setShowAddCours(false)}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Créer un cours</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>Coach *</Text>
            <ScrollView style={{ maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 8 }} nestedScrollEnabled>
              {coachs.filter(c => c.statut === 1).map((c: any) => (
                <TouchableOpacity key={c.id_coach} onPress={() => setCoursForm({ ...coursForm, id_coach: String(c.id_coach) })}
                  style={[{ flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: coursForm.id_coach === String(c.id_coach) ? colors.primary + "15" : "transparent" }]}>
                  <Text style={{ color: coursForm.id_coach === String(c.id_coach) ? colors.primary : colors.foreground, fontWeight: "600" }}>{c.prenom} {c.nom} — {c.specialite}</Text>
                  {coursForm.id_coach === String(c.id_coach) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EliteInput label="Type de cours *" value={coursForm.type_cours} onChangeText={(v) => setCoursForm({ ...coursForm, type_cours: v })} placeholder="ex: Body Pump" />
            <EliteInput label="Date (YYYY-MM-DD) *" value={coursForm.date_cours} onChangeText={(v) => setCoursForm({ ...coursForm, date_cours: v })} placeholder="2026-05-15" />
            <EliteInput label="Heure (HH:MM) *" value={coursForm.heure_debut} onChangeText={(v) => setCoursForm({ ...coursForm, heure_debut: v })} placeholder="09:00" />
            <EliteInput label="Salle *" value={coursForm.salle} onChangeText={(v) => setCoursForm({ ...coursForm, salle: v })} placeholder="Salle A" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteInput label="Durée (min)" value={coursForm.duree_minutes} onChangeText={(v) => setCoursForm({ ...coursForm, duree_minutes: v })} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><EliteInput label="Capacité" value={coursForm.capacite_max} onChangeText={(v) => setCoursForm({ ...coursForm, capacite_max: v })} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddCours(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Créer" onPress={handleCreateCours} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Enregistrer un paiement */}
      <Modal visible={showAddPaiement} animationType="slide" transparent onRequestClose={() => setShowAddPaiement(false)}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Enregistrer un paiement</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>Membre *</Text>
            <ScrollView style={{ maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 8 }} nestedScrollEnabled>
              {membres.filter(m => m.statut === 1).map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setPaiForm({ ...paiForm, id_membre: String(m.id_membre) })}
                  style={[{ flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: paiForm.id_membre === String(m.id_membre) ? colors.primary + "15" : "transparent" }]}>
                  <Text style={{ color: paiForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground, fontWeight: "600" }}>{m.prenom} {m.nom}</Text>
                  {paiForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EliteInput label="Montant (DA) *" value={paiForm.montant} onChangeText={(v) => setPaiForm({ ...paiForm, montant: v })} placeholder="2500" keyboardType="numeric" />
            <EliteInput label="Motif" value={paiForm.motif} onChangeText={(v) => setPaiForm({ ...paiForm, motif: v })} placeholder="Abonnement" />
            <EliteInput label="Date (YYYY-MM-DD)" value={paiForm.date_paiement} onChangeText={(v) => setPaiForm({ ...paiForm, date_paiement: v })} placeholder="2026-05-10" />
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>Mode de paiement</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {MODES_PAIEMENT.map((mode) => (
                  <TouchableOpacity key={mode} onPress={() => setPaiForm({ ...paiForm, mode_paiement: mode })}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: paiForm.mode_paiement === mode ? colors.primary : colors.border, backgroundColor: paiForm.mode_paiement === mode ? colors.primary + "15" : "transparent" }}>
                    <Text style={{ color: paiForm.mode_paiement === mode ? colors.primary : colors.foreground, fontWeight: "600", fontSize: 13 }}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAddPaiement(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Enregistrer" onPress={handleAddPaiement} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Formule abonnement */}
      <Modal visible={showAddFormule} animationType="slide" transparent onRequestClose={() => { setShowAddFormule(false); setEditFormule(null); }}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>{editFormule ? "Modifier la formule" : "Nouvelle formule"}</Text>
            <EliteInput label="Nom *" value={formulForm.nom} onChangeText={(v) => setFormulForm({ ...formulForm, nom: v })} placeholder="ex: Mensuel" />
            <EliteInput label="Description" value={formulForm.description} onChangeText={(v) => setFormulForm({ ...formulForm, description: v })} placeholder="Description..." multiline />
            <EliteInput label="Tarif (DA) *" value={formulForm.tarif} onChangeText={(v) => setFormulForm({ ...formulForm, tarif: v })} placeholder="2500" keyboardType="numeric" />
            <EliteInput label="Durée (jours) *" value={formulForm.duree_jours} onChangeText={(v) => setFormulForm({ ...formulForm, duree_jours: v })} placeholder="30" keyboardType="numeric" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => { setShowAddFormule(false); setEditFormule(null); }} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title={editFormule ? "Modifier" : "Créer"} onPress={handleSaveFormule} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Affecter abonnement */}
      <Modal visible={showAffecterAbo} animationType="slide" transparent onRequestClose={() => setShowAffecterAbo(false)}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Affecter un abonnement</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>Membre *</Text>
            <ScrollView style={{ maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 8 }} nestedScrollEnabled>
              {membres.filter(m => m.statut === 1).map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setAboForm({ ...aboForm, id_membre: String(m.id_membre) })}
                  style={[{ flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: aboForm.id_membre === String(m.id_membre) ? colors.primary + "15" : "transparent" }]}>
                  <Text style={{ color: aboForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground, fontWeight: "600" }}>{m.prenom} {m.nom}</Text>
                  {aboForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>Formule *</Text>
            <ScrollView style={{ maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 8 }} nestedScrollEnabled>
              {formules.filter(f => f.actif).map((f: any) => (
                <TouchableOpacity key={f.id_formule} onPress={() => setAboForm({ ...aboForm, id_formule: String(f.id_formule) })}
                  style={[{ flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: aboForm.id_formule === String(f.id_formule) ? colors.primary + "15" : "transparent" }]}>
                  <Text style={{ color: aboForm.id_formule === String(f.id_formule) ? colors.primary : colors.foreground, fontWeight: "600" }}>{f.nom} — {Number(f.tarif).toLocaleString()} DA</Text>
                  {aboForm.id_formule === String(f.id_formule) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EliteInput label="Date début" value={aboForm.date_debut} onChangeText={(v) => setAboForm({ ...aboForm, date_debut: v })} placeholder="2026-05-10" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowAffecterAbo(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Affecter" onPress={handleAffecterAbo} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Équipement */}
      <Modal visible={showAddEquipement} animationType="slide" transparent onRequestClose={() => { setShowAddEquipement(false); setEditEquipement(null); }}>
        <View style={s.overlay}><ScrollView>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>{editEquipement ? "Modifier l'équipement" : "Ajouter un équipement"}</Text>
            <EliteInput label="Nom *" value={equipForm.nom} onChangeText={(v) => setEquipForm({ ...equipForm, nom: v })} placeholder="ex: Tapis de course" />
            <EliteInput label="Catégorie" value={equipForm.categorie} onChangeText={(v) => setEquipForm({ ...equipForm, categorie: v })} placeholder="Musculation, Cardio..." />
            <Text style={[s.sub, { color: colors.mutedForeground, marginBottom: 4 }]}>État</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {Object.entries(ETAT_INFO).map(([key, val]) => (
                <TouchableOpacity key={key} onPress={() => setEquipForm({ ...equipForm, etat: key })}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: equipForm.etat === key ? val.color : colors.border, backgroundColor: equipForm.etat === key ? val.color + "20" : "transparent" }}>
                  <Text style={{ color: equipForm.etat === key ? val.color : colors.mutedForeground, fontSize: 12, fontWeight: "700" }}>{val.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <EliteInput label="Quantité" value={equipForm.quantite} onChangeText={(v) => setEquipForm({ ...equipForm, quantite: v })} placeholder="1" keyboardType="numeric" />
            <EliteInput label="Notes" value={equipForm.notes} onChangeText={(v) => setEquipForm({ ...equipForm, notes: v })} placeholder="Notes optionnelles..." multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => { setShowAddEquipement(false); setEditEquipement(null); }} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title={editEquipement ? "Modifier" : "Ajouter"} onPress={handleSaveEquipement} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerAvatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
  notifBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#E63946", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  statCard: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
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
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  calCell: { width: "14.28%", minHeight: 44, padding: 2, gap: 1 },
  calEvent: { borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingBottom: 12, paddingTop: 6 },
  bottomBarInner: { flexDirection: "row", paddingHorizontal: 8, gap: 4 },
  bottomTabBtn: { alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 14, paddingVertical: 6, minWidth: 56 },
  bottomTabLabel: { fontSize: 9, fontWeight: "700", textAlign: "center" },
  badgeDot: { position: "absolute", top: -2, right: -2, backgroundColor: "#ef4444", borderRadius: 6, minWidth: 14, height: 14, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },
});
