import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Alert, Modal, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab = "cours"|"presences"|"avis"|"membres"|"progress"|"exercices"|"parametres";

const STATUT_STYLE: Record<string, { color: string; label: string }> = {
  en_attente: { color: "#f59e0b", label: "En attente" },
  publie:     { color: "#10b981", label: "Approuvé ✓" },
  annule:     { color: "#ef4444", label: "Refusé" },
  termine:    { color: "#6b7280", label: "Terminé" },
};

function Stars({ note, size = 14 }: { note: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1,2,3,4,5].map((n) => (
        <Feather key={n} name="star" size={size} color={n <= Math.round(note) ? "#f59e0b" : "#d1d5db"} />
      ))}
    </View>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const colors = useColors();
  return (
    <View style={[cs.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Feather name="search" size={14} color={colors.mutedForeground} />
      <TextInput
        style={[cs.searchInput, { color: colors.foreground }]}
        placeholder={placeholder || "Rechercher..."}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChange}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity>
      )}
    </View>
  );
}

export default function CoachDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("cours");

  const [cours, setCours] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [suivis, setSuivis] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [avisData, setAvisData] = useState<{ avis: any[]; moyennes: any[] }>({ avis: [], moyennes: [] });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingAvis, setLoadingAvis] = useState(false);

  // Recherche
  const [searchMembre, setSearchMembre] = useState("");
  const [searchSuivi, setSearchSuivi] = useState("");
  const [searchProg, setSearchProg] = useState("");

  // Paramètres
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [nouvelEmail, setNouvelEmail] = useState("");
  const [loadingParam, setLoadingParam] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showExerciceModal, setShowExerciceModal] = useState(false);
  const [showSuiviModal, setShowSuiviModal] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedAvis, setSelectedAvis] = useState<any>(null);

  const [form, setForm] = useState({ type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
  const [exerciceForm, setExerciceForm] = useState({ id_membre: "", titre: "", description: "" });
  const [suiviForm, setSuiviForm] = useState({ id_membre: "", poids_kg: "", imc: "", tour_taille: "", observations: "" });
  const [loading, setLoading] = useState(false);

  // Présences
  const [coursPasses, setCoursPasses] = useState<any[]>([]);
  const [selectedCours, setSelectedCours] = useState<any>(null);
  const [presencesMembres, setPresencesMembres] = useState<any[]>([]);
  const [presencesState, setPresencesState] = useState<Record<number, boolean>>({});
  const [loadingPresences, setLoadingPresences] = useState(false);
  const [savingPresences, setSavingPresences] = useState(false);

  const load = async () => {
    if (!user?.id_coach) return;
    try {
      const [c, m, notifs] = await Promise.all([
        api.get(`/cours/coach/${user.id_coach}`),
        api.get(`/coachs/${user.id_coach}/membres`),
        api.get(`/admin/notifications?id_util=${user?.id}`).catch(() => []),
      ]);
      setCours(c);
      setMembres(m);
      setNotifications(notifs);
    } catch {}
  };

  const loadProgress = async () => {
    if (!user?.id_coach) return;
    try {
      const [s, p] = await Promise.all([
        api.get(`/progress/coach/${user.id_coach}`),
        api.get(`/exercices/coach/${user.id_coach}`),
      ]);
      setSuivis(s);
      setProgrammes(p);
    } catch {}
  };

  const loadAvis = async () => {
    if (!user?.id_coach) return;
    setLoadingAvis(true);
    try {
      const data = await api.get(`/avis/coach/${user.id_coach}`);
      setAvisData(data);
    } catch {}
    setLoadingAvis(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === "progress" || tab === "exercices") loadProgress();
    if (tab === "avis") loadAvis();
    if (tab === "presences") loadCoursPasses();
  }, [tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    if (tab === "progress" || tab === "exercices") await loadProgress();
    if (tab === "avis") await loadAvis();
    setRefreshing(false);
  };

  // Filtered
  const filteredMembres = membres.filter(m =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchMembre.toLowerCase())
  );
  const filteredSuiviMembres = membres.filter(m =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchSuivi.toLowerCase())
  );
  const filteredProgMembres = membres.filter(m =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchProg.toLowerCase())
  );

  const handleAjouterCours = async () => {
    if (!form.type_cours || !form.date_cours || !form.heure_debut || !form.salle) {
      Alert.alert("Erreur", "Remplissez tous les champs"); return;
    }
    setLoading(true);
    try {
      await api.post("/cours", { id_coach: user?.id_coach, ...form, duree_minutes: parseInt(form.duree_minutes)||60, capacite_max: parseInt(form.capacite_max)||20 });
      Alert.alert("Cours soumis ✓", "En attente d'approbation admin");
      setShowModal(false);
      setForm({ type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterExercice = async () => {
    if (!exerciceForm.id_membre || !exerciceForm.titre) { Alert.alert("Erreur", "Sélectionnez un membre et entrez un titre"); return; }
    setLoading(true);
    try {
      await api.post("/exercices", { id_coach: user?.id_coach, id_membre: parseInt(exerciceForm.id_membre), titre: exerciceForm.titre, description: exerciceForm.description });
      Alert.alert("Succès", "Programme créé ✓");
      setShowExerciceModal(false);
      setExerciceForm({ id_membre: "", titre: "", description: "" });
      setSearchProg("");
      loadProgress();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterSuivi = async () => {
    if (!suiviForm.id_membre) { Alert.alert("Erreur", "Sélectionnez un membre"); return; }
    setLoading(true);
    try {
      await api.post("/progress", {
        id_coach: user?.id_coach, id_membre: parseInt(suiviForm.id_membre),
        poids_kg: suiviForm.poids_kg ? parseFloat(suiviForm.poids_kg) : undefined,
        imc: suiviForm.imc ? parseFloat(suiviForm.imc) : undefined,
        tour_taille: suiviForm.tour_taille ? parseFloat(suiviForm.tour_taille) : undefined,
        observations: suiviForm.observations || undefined,
      });
      Alert.alert("Succès", "Mesure enregistrée ✓");
      setShowSuiviModal(false);
      setSuiviForm({ id_membre: "", poids_kg: "", imc: "", tour_taille: "", observations: "" });
      setSearchSuivi("");
      loadProgress();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const loadCoursPasses = async () => {
    if (!user?.id_coach) return;
    try {
      const c = await api.get(`/cours/coach/${user.id_coach}`);
      const today = new Date().toISOString().slice(0, 10);
      setCoursPasses(c.filter((x: any) => x.date_cours?.slice(0, 10) <= today && x.statut === "publie"));
    } catch {}
  };

  const handleSelectCours = async (cours: any) => {
    setSelectedCours(cours);
    setPresencesState({});
    setLoadingPresences(true);
    try {
      const members = await api.get(`/presences/cours/${cours.id_cours}`);
      setPresencesMembres(members);
      const state: Record<number, boolean> = {};
      members.forEach((m: any) => { state[m.id_reservation] = !!m.present; });
      setPresencesState(state);
    } catch {}
    setLoadingPresences(false);
  };

  const handleMarquerPresences = async () => {
    if (!selectedCours) return;
    setSavingPresences(true);
    try {
      const presences = presencesMembres.map((m: any) => ({
        id_reservation: m.id_reservation,
        id_membre: m.id_membre,
        present: !!presencesState[m.id_reservation],
      }));
      await api.post("/presences/marquer", { id_cours: selectedCours.id_cours, presences, id_util_coach: user?.id });
      Alert.alert("Succès ✓", "Présences enregistrées");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    setSavingPresences(false);
  };

  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp || nouveauMdp.length < 6) { Alert.alert("Erreur", "Vérifiez les champs (min 6 car.)"); return; }
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
    try { await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel }); Alert.alert("Succès", "Numéro modifié ✓"); setNouveauTel(""); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };
  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoadingParam(true);
    try { await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail }); Alert.alert("Succès", "Email modifié ✓"); setNouvelEmail(""); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "cours",      label: "Planning",  icon: "calendar" },
    { key: "presences",  label: "Présences", icon: "check-circle" },
    { key: "avis",       label: "Avis",      icon: "star" },
    { key: "membres",    label: "Membres",   icon: "users" },
    { key: "progress",   label: "Suivi",     icon: "trending-up" },
    { key: "exercices",  label: "Programmes",icon: "clipboard" },
    { key: "parametres", label: "Paramètres",icon: "settings" },
  ];

  const avisParCours: Record<number, any[]> = {};
  avisData.avis.forEach((a) => {
    if (!avisParCours[a.id_cours]) avisParCours[a.id_cours] = [];
    avisParCours[a.id_cours].push(a);
  });

  const unreadNotifs = notifications.filter((n: any) => !n.lu).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[cs.header, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
        <View style={cs.headerAvatar}>
          <Text style={cs.headerAvatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cs.headerTitle}>{user?.prenom} {user?.nom}</Text>
          <Text style={cs.headerSub}>Coach</Text>
        </View>
        <TouchableOpacity onPress={() => setShowNotifs(true)} style={{ marginRight: 14, position: "relative" }}>
          <Feather name="bell" size={22} color="rgba(255,255,255,0.9)" />
          {unreadNotifs > 0 && (
            <View style={cs.notifBadge}><Text style={cs.notifBadgeText}>{unreadNotifs}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Tab bar scrollable (top) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[cs.tabBarScroll, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        contentContainerStyle={cs.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[cs.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[cs.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[cs.content, { paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* PLANNING */}
        {tab === "cours" && (
          <>
            <TouchableOpacity onPress={() => setShowModal(true)} style={[cs.bigBtn, { backgroundColor: colors.primary }]}>
              <Feather name="plus-circle" size={18} color="#fff" />
              <Text style={cs.bigBtnText}>Soumettre un cours</Text>
            </TouchableOpacity>
            <View style={[cs.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
              <Text style={[cs.infoText, { color: "#b45309" }]}>📋 Les cours soumis nécessitent l'approbation de l'admin avant d'être publiés.</Text>
            </View>
            {cours.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun cours planifié</Text>
            ) : cours.map((c: any) => {
              const st = STATUT_STYLE[c.statut] || { color: "#6b7280", label: c.statut };
              return (
                <View key={c.id_cours} style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[cs.coursNom, { color: colors.foreground }]}>{c.type_cours}</Text>
                      <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>📅 {c.date_cours?.slice(0,10)} · {c.heure_debut?.slice(0,5)} · {c.duree_minutes} min</Text>
                      <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>🏠 {c.salle} · {c.places_restantes}/{c.capacite_max} places</Text>
                    </View>
                    <View style={[cs.statusBadge, { backgroundColor: st.color + "15" }]}>
                      <Text style={[cs.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* PRÉSENCES */}
        {tab === "presences" && (
          <>
            <View style={[cs.infoBox, { backgroundColor: "#10b98110", borderColor: "#10b98130" }]}>
              <Text style={[cs.infoText, { color: "#065f46" }]}>✅ Sélectionnez un cours passé pour enregistrer les présences.</Text>
            </View>
            {coursPasses.length === 0 ? (
              <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30 }]}>
                <Feather name="calendar" size={30} color={colors.mutedForeground} />
                <Text style={[cs.coursInfo, { color: colors.mutedForeground, marginTop: 8, textAlign: "center" }]}>Aucun cours passé approuvé.</Text>
              </View>
            ) : (
              <>
                <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Cours passés</Text>
                {coursPasses.map((c: any) => {
                  const isSelected = selectedCours?.id_cours === c.id_cours;
                  return (
                    <TouchableOpacity key={c.id_cours} onPress={() => handleSelectCours(c)}
                      style={[cs.card, { backgroundColor: isSelected ? colors.primary + "15" : colors.card, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 }]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[cs.coursNom, { color: colors.foreground }]}>{c.type_cours}</Text>
                          <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>📅 {c.date_cours?.slice(0,10)} · {c.heure_debut?.slice(0,5)} · {c.salle}</Text>
                        </View>
                        {isSelected && <Feather name="check-circle" size={20} color={colors.primary} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {selectedCours && (
                  <>
                    <Text style={[cs.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                      Membres inscrits — {selectedCours.type_cours}
                    </Text>
                    {loadingPresences ? (
                      <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", padding: 20 }]}>
                        <Text style={{ color: colors.mutedForeground }}>Chargement...</Text>
                      </View>
                    ) : presencesMembres.length === 0 ? (
                      <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", padding: 20 }]}>
                        <Text style={{ color: colors.mutedForeground }}>Aucun membre inscrit à ce cours</Text>
                      </View>
                    ) : (
                      <>
                        {presencesMembres.map((m: any) => {
                          const isPresent = !!presencesState[m.id_reservation];
                          return (
                            <TouchableOpacity key={m.id_reservation}
                              onPress={() => setPresencesState((prev) => ({ ...prev, [m.id_reservation]: !prev[m.id_reservation] }))}
                              style={[cs.card, { backgroundColor: isPresent ? "#10b98110" : colors.card, borderColor: isPresent ? "#10b981" : colors.border, borderWidth: 1.5 }]}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <View style={[cs.avatar, { backgroundColor: (isPresent ? "#10b981" : colors.primary) + "20" }]}>
                                  <Text style={[cs.avatarText, { color: isPresent ? "#10b981" : colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[cs.coursNom, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                                </View>
                                <View style={[cs.presenceBadge, { backgroundColor: isPresent ? "#10b98120" : colors.background, borderColor: isPresent ? "#10b981" : colors.border }]}>
                                  <Feather name={isPresent ? "check" : "x"} size={16} color={isPresent ? "#10b981" : colors.mutedForeground} />
                                  <Text style={[cs.presenceText, { color: isPresent ? "#10b981" : colors.mutedForeground }]}>{isPresent ? "Présent" : "Absent"}</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                        <EliteButton title={savingPresences ? "Enregistrement..." : "Enregistrer les présences"} onPress={handleMarquerPresences} loading={savingPresences} variant="primary" />
                        <Text style={[cs.coursInfo, { color: colors.mutedForeground, textAlign: "center" }]}>
                          {Object.values(presencesState).filter(Boolean).length} présent(s) sur {presencesMembres.length}
                        </Text>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* AVIS */}
        {tab === "avis" && (
          <>
            {loadingAvis ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 30 }}>Chargement...</Text>
            ) : avisData.moyennes.length === 0 ? (
              <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30 }]}>
                <Feather name="star" size={36} color={colors.mutedForeground} />
                <Text style={[cs.coursNom, { color: colors.mutedForeground, textAlign: "center", marginTop: 10 }]}>Aucun avis reçu</Text>
              </View>
            ) : (
              <>
                {(() => {
                  const total = avisData.moyennes.reduce((s, m) => s + m.nb_avis, 0);
                  const avg = avisData.moyennes.reduce((s, m) => s + m.note_moyenne * m.nb_avis, 0) / total;
                  return (
                    <View style={[cs.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                      <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Note globale</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Text style={{ fontSize: 44, fontWeight: "900", color: colors.primary }}>{avg.toFixed(1)}</Text>
                        <View>
                          <Stars note={avg} size={20} />
                          <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{total} avis · {avisData.moyennes.length} cours</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
                {avisData.moyennes.map((m: any) => {
                  const avisCours = avisParCours[m.id_cours] || [];
                  const isOpen = selectedAvis === m.id_cours;
                  return (
                    <View key={m.id_cours}>
                      <TouchableOpacity onPress={() => setSelectedAvis(isOpen ? null : m.id_cours)}
                        style={[cs.card, { backgroundColor: colors.card, borderColor: isOpen ? colors.primary : colors.border }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[cs.coursNom, { color: colors.foreground }]}>{m.type_cours}</Text>
                            <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{m.date_cours?.slice(0,10)}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Stars note={m.note_moyenne} />
                              <Text style={{ fontSize: 13, fontWeight: "800", color: "#f59e0b" }}>{Number(m.note_moyenne).toFixed(1)}</Text>
                              <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>({m.nb_avis})</Text>
                            </View>
                          </View>
                          <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                        </View>
                        {isOpen && avisCours.map((a: any) => (
                          <View key={a.id_avis} style={[cs.avisCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                              <Text style={[cs.coursNom, { color: colors.foreground, fontSize: 13 }]}>{a.membre_nom}</Text>
                              <Stars note={a.note} size={12} />
                            </View>
                            {a.commentaire && <Text style={[cs.coursInfo, { color: colors.foreground, fontStyle: "italic" }]}>"{a.commentaire}"</Text>}
                            <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{a.date_avis?.slice(0,10)}</Text>
                          </View>
                        ))}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* MEMBRES INSCRITS */}
        {tab === "membres" && (
          <>
            <SearchBar value={searchMembre} onChange={setSearchMembre} placeholder="Rechercher un membre..." />
            <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Membres ({filteredMembres.length})</Text>
            {filteredMembres.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun membre trouvé</Text>
            ) : filteredMembres.map((m: any) => (
              <View key={m.id_membre} style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[cs.avatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[cs.avatarText, { color: colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[cs.coursNom, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                    <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>#{m.id_membre} · {m.telephone || m.email || "—"}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* SUIVI */}
        {tab === "progress" && (
          <>
            <TouchableOpacity onPress={() => { setShowSuiviModal(true); setSearchSuivi(""); }} style={[cs.bigBtn, { backgroundColor: colors.primary }]}>
              <Feather name="plus-circle" size={18} color="#fff" />
              <Text style={cs.bigBtnText}>Ajouter une mesure</Text>
            </TouchableOpacity>
            <Text style={[cs.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Historique</Text>
            {suivis.length === 0 ? (
              <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucune mesure</Text>
              </View>
            ) : suivis.map((s: any) => (
              <View key={s.id_suivi} style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[cs.coursNom, { color: colors.foreground }]}>{s.membre_nom}</Text>
                  <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{s.date_mesure?.slice(0,10)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {s.poids_kg && <View style={[cs.pill, { backgroundColor: colors.primary + "15" }]}><Text style={[cs.pillText, { color: colors.primary }]}>{s.poids_kg} kg</Text></View>}
                  {s.imc && <View style={[cs.pill, { backgroundColor: "#10b98115" }]}><Text style={[cs.pillText, { color: "#10b981" }]}>IMC {s.imc}</Text></View>}
                  {s.tour_taille && <View style={[cs.pill, { backgroundColor: "#f59e0b15" }]}><Text style={[cs.pillText, { color: "#f59e0b" }]}>{s.tour_taille} cm</Text></View>}
                </View>
                {s.observations && <Text style={[cs.coursInfo, { color: colors.foreground }]}>📝 {s.observations}</Text>}
              </View>
            ))}
          </>
        )}

        {/* PROGRAMMES */}
        {tab === "exercices" && (
          <>
            <TouchableOpacity onPress={() => { setShowExerciceModal(true); setSearchProg(""); }} style={[cs.bigBtn, { backgroundColor: colors.primary }]}>
              <Feather name="plus-circle" size={18} color="#fff" />
              <Text style={cs.bigBtnText}>Créer un programme</Text>
            </TouchableOpacity>
            <Text style={[cs.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Programmes créés</Text>
            {programmes.length === 0 ? (
              <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucun programme créé</Text>
              </View>
            ) : programmes.map((p: any) => (
              <View key={p.id_programme} style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[cs.coursNom, { color: colors.foreground }]}>{p.titre}</Text>
                <Text style={[cs.coursInfo, { color: colors.primary }]}>Pour : {p.membre_nom}</Text>
                {p.description && <Text style={[cs.coursInfo, { color: colors.foreground }]}>{p.description}</Text>}
                <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{p.date_creation?.slice(0,10)}</Text>
              </View>
            ))}
          </>
        )}

        {/* PARAMÈTRES */}
        {tab === "parametres" && (
          <>
            <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Informations</Text>
              {[
                { icon: "user",  label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
                { icon: "mail",  label: "Email",        value: user?.email || "—" },
                { icon: "phone", label: "Téléphone",    value: user?.telephone || "—" },
              ].map((item) => (
                <View key={item.label} style={cs.infoRow}>
                  <Feather name={item.icon as any} size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[cs.coursNom, { color: colors.foreground, fontSize: 14 }]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
              <EliteInput label="Ancien" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
              <EliteInput label="Nouveau" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
              <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loadingParam} variant="secondary" small />
            </View>
            <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
              <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
              <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loadingParam} variant="secondary" small />
            </View>
            <View style={[cs.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[cs.sectionTitle, { color: colors.foreground }]}>Changer l'email</Text>
              <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="coach@elitegym.dz" keyboardType="email-address" autoCapitalize="none" />
              <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loadingParam} variant="secondary" small />
            </View>
            <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
          </>
        )}
      </ScrollView>

      {/* Modal Notifications */}
      <Modal visible={showNotifs} animationType="slide" transparent onRequestClose={() => setShowNotifs(false)}>
        <View style={cs.modalOverlay}>
          <View style={[cs.modalContent, { backgroundColor: colors.card, maxHeight: "80%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[cs.modalTitle, { color: colors.foreground }]}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifs(false)}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
            </View>
            <ScrollView>
              {notifications.length === 0 ? (
                <Text style={[cs.coursInfo, { color: colors.mutedForeground, textAlign: "center", paddingVertical: 20 }]}>Aucune notification</Text>
              ) : notifications.map((n: any) => (
                <View key={n.id_notif} style={[cs.card, { backgroundColor: n.lu ? colors.background : colors.primary + "10", borderColor: n.lu ? colors.border : colors.primary + "40" }]}>
                  <Text style={[cs.coursNom, { color: colors.foreground, fontSize: 13 }]}>{n.titre}</Text>
                  {n.message && <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{n.message}</Text>}
                  <Text style={[cs.coursInfo, { color: colors.mutedForeground }]}>{new Date(n.date_creation).toLocaleString("fr-FR")}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Nouveau cours */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={cs.modalOverlay}><ScrollView>
          <View style={[cs.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[cs.modalTitle, { color: colors.foreground }]}>Soumettre un cours</Text>
            <EliteInput label="Type de cours" placeholder="ex: Body Pump" value={form.type_cours} onChangeText={(v) => setForm({ ...form, type_cours: v })} />
            <EliteInput label="Date (YYYY-MM-DD)" placeholder="2026-05-10" value={form.date_cours} onChangeText={(v) => setForm({ ...form, date_cours: v })} />
            <EliteInput label="Heure (HH:MM)" placeholder="09:00" value={form.heure_debut} onChangeText={(v) => setForm({ ...form, heure_debut: v })} />
            <EliteInput label="Salle" placeholder="Salle A" value={form.salle} onChangeText={(v) => setForm({ ...form, salle: v })} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteInput label="Durée (min)" value={form.duree_minutes} onChangeText={(v) => setForm({ ...form, duree_minutes: v })} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><EliteInput label="Capacité" value={form.capacite_max} onChangeText={(v) => setForm({ ...form, capacite_max: v })} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowModal(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Soumettre" onPress={handleAjouterCours} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Nouveau programme (avec recherche) */}
      <Modal visible={showExerciceModal} animationType="slide" transparent onRequestClose={() => setShowExerciceModal(false)}>
        <View style={cs.modalOverlay}><ScrollView>
          <View style={[cs.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[cs.modalTitle, { color: colors.foreground }]}>Nouveau programme</Text>
            <Text style={[cs.label, { color: colors.mutedForeground }]}>Membre *</Text>
            <SearchBar value={searchProg} onChange={setSearchProg} placeholder="Rechercher un membre..." />
            <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 10 }} nestedScrollEnabled>
              {filteredProgMembres.map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setExerciceForm({ ...exerciceForm, id_membre: String(m.id_membre) })}
                  style={[cs.selectRow, { borderColor: exerciceForm.id_membre === String(m.id_membre) ? colors.primary : colors.border, backgroundColor: exerciceForm.id_membre === String(m.id_membre) ? colors.primary + "15" : "transparent" }]}>
                  <Text style={[cs.selectText, { color: exerciceForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground }]}>{m.prenom} {m.nom}</Text>
                  {exerciceForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EliteInput label="Titre" placeholder="ex: Programme Cardio 4 semaines" value={exerciceForm.titre} onChangeText={(v) => setExerciceForm({ ...exerciceForm, titre: v })} />
            <EliteInput label="Description" placeholder="Détails du programme..." value={exerciceForm.description} onChangeText={(v) => setExerciceForm({ ...exerciceForm, description: v })} multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowExerciceModal(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Créer" onPress={handleAjouterExercice} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>

      {/* Modal: Nouvelle mesure (avec recherche) */}
      <Modal visible={showSuiviModal} animationType="slide" transparent onRequestClose={() => setShowSuiviModal(false)}>
        <View style={cs.modalOverlay}><ScrollView>
          <View style={[cs.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[cs.modalTitle, { color: colors.foreground }]}>Nouvelle mesure</Text>
            <Text style={[cs.label, { color: colors.mutedForeground }]}>Membre *</Text>
            <SearchBar value={searchSuivi} onChange={setSearchSuivi} placeholder="Rechercher un membre..." />
            <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 10 }} nestedScrollEnabled>
              {filteredSuiviMembres.map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setSuiviForm({ ...suiviForm, id_membre: String(m.id_membre) })}
                  style={[cs.selectRow, { borderColor: suiviForm.id_membre === String(m.id_membre) ? colors.primary : colors.border, backgroundColor: suiviForm.id_membre === String(m.id_membre) ? colors.primary + "15" : "transparent" }]}>
                  <Text style={[cs.selectText, { color: suiviForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground }]}>{m.prenom} {m.nom}</Text>
                  {suiviForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteInput label="Poids (kg)" value={suiviForm.poids_kg} onChangeText={(v) => setSuiviForm({ ...suiviForm, poids_kg: v })} keyboardType="numeric" placeholder="70.5" /></View>
              <View style={{ flex: 1 }}><EliteInput label="IMC" value={suiviForm.imc} onChangeText={(v) => setSuiviForm({ ...suiviForm, imc: v })} keyboardType="numeric" placeholder="22.4" /></View>
            </View>
            <EliteInput label="Tour de taille (cm)" value={suiviForm.tour_taille} onChangeText={(v) => setSuiviForm({ ...suiviForm, tour_taille: v })} keyboardType="numeric" placeholder="80" />
            <EliteInput label="Observations" value={suiviForm.observations} onChangeText={(v) => setSuiviForm({ ...suiviForm, observations: v })} placeholder="Progrès, remarques..." multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowSuiviModal(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Enregistrer" onPress={handleAjouterSuivi} loading={loading} /></View>
            </View>
          </View>
        </ScrollView></View>
      </Modal>
    </View>
  );
}

const cs = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerAvatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
  notifBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#E63946", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  tabBarScroll: { borderBottomWidth: 1 },
  tabBarContent: { flexDirection: "row" },
  tabBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12, paddingHorizontal: 14 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
  content: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  card: { borderRadius: 12, padding: 14, gap: 6, borderWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  coursNom: { fontSize: 15, fontWeight: "700" },
  coursInfo: { fontSize: 12, lineHeight: 18 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "700" },
  infoBox: { borderRadius: 8, padding: 10, borderWidth: 1 },
  infoText: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" },
  avisCard: { borderRadius: 8, padding: 10, borderWidth: 1, gap: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "transparent" },
  presenceBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  presenceText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  selectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 4 },
  selectText: { fontSize: 14, fontWeight: "600" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  bigBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 12, paddingVertical: 16, marginBottom: 4 },
  bigBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
