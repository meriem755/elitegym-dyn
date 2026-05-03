import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Alert, Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab = "cours" | "presences" | "avis" | "membres" | "progress" | "exercices" | "parametres";

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
  const [loadingAvis, setLoadingAvis] = useState(false);

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
  const [selectedAvis, setSelectedAvis] = useState<any>(null); // pour voir le détail d'un cours

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
      const [c, m] = await Promise.all([
        api.get(`/cours/coach/${user.id_coach}`),
        api.get(`/coachs/${user.id_coach}/membres`),
      ]);
      setCours(c);
      setMembres(m);
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
    await Promise.all([load(), loadProgress()]);
    if (tab === "avis") await loadAvis();
    setRefreshing(false);
  };

  const handleAjouterCours = async () => {
    if (!form.type_cours || !form.date_cours || !form.heure_debut || !form.salle) {
      Alert.alert("Erreur", "Remplissez tous les champs"); return;
    }
    setLoading(true);
    try {
      await api.post("/cours", { ...form, id_coach: user?.id_coach, duree_minutes: parseInt(form.duree_minutes), capacite_max: parseInt(form.capacite_max) });
      Alert.alert("Soumis ✓", "Votre cours est soumis pour approbation.");
      setShowModal(false);
      setForm({ type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterExercice = async () => {
    if (!exerciceForm.id_membre || !exerciceForm.titre) { Alert.alert("Erreur", "Sélectionnez un membre et ajoutez un titre"); return; }
    setLoading(true);
    try {
      await api.post("/exercices", { id_coach: user?.id_coach, id_membre: parseInt(exerciceForm.id_membre), titre: exerciceForm.titre, description: exerciceForm.description });
      Alert.alert("Succès", "Programme créé ✓");
      setShowExerciceModal(false);
      setExerciceForm({ id_membre: "", titre: "", description: "" });
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
      await api.post("/presences/marquer", {
        id_cours: selectedCours.id_cours,
        presences,
        id_util_coach: user?.id,
      });
      Alert.alert("Succès ✓", "Présences enregistrées");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    setSavingPresences(false);
  };

  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert("Erreur", "Remplissez les deux champs"); return; }
    if (nouveauMdp.length < 6) { Alert.alert("Erreur", "Mot de passe trop court (min 6 caractères)"); return; }
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
      Alert.alert("Succès", "Numéro modifié ✓");
      setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoadingParam(true);
    try {
      await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail });
      Alert.alert("Succès", "Email modifié ✓");
      setNouvelEmail("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "cours",      label: "Planning",   icon: "calendar" },
    { key: "presences",  label: "Présences",  icon: "check-circle" },
    { key: "avis",       label: "Avis",        icon: "star" },
    { key: "membres",    label: "Membres",     icon: "users" },
    { key: "progress",   label: "Suivi",       icon: "trending-up" },
    { key: "exercices",  label: "Programmes",  icon: "clipboard" },
    { key: "parametres", label: "Paramètres",  icon: "settings" },
  ];

  // Avis groupés par cours pour l'onglet Avis
  const avisParCours: Record<number, any[]> = {};
  avisData.avis.forEach((a) => {
    if (!avisParCours[a.id_cours]) avisParCours[a.id_cours] = [];
    avisParCours[a.id_cours].push(a);
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 80 : insets.top }]}>
        <View>
          <Text style={styles.headerTitle}>Espace Coach</Text>
          <Text style={styles.headerSub}>{user?.prenom} {user?.nom}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Tab bar scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.tabBarScroll, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── PLANNING ── */}
        {tab === "cours" && (
          <>
            <EliteButton title="Soumettre un cours" onPress={() => setShowModal(true)} variant="primary" />
            <View style={[styles.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
              <Text style={[styles.infoText, { color: "#b45309" }]}>
                📋 Les cours soumis nécessitent l'approbation de l'admin avant d'être publiés.
              </Text>
            </View>
            {cours.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun cours planifié</Text>
            ) : cours.map((c: any) => {
              const s = STATUT_STYLE[c.statut] || { color: "#6b7280", label: c.statut };
              return (
                <View key={c.id_cours} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.coursNom, { color: colors.foreground }]}>{c.type_cours}</Text>
                      <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                        📅 {c.date_cours?.slice(0,10)} • {c.heure_debut?.slice(0,5)} • {c.duree_minutes} min
                      </Text>
                      <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                        🏠 {c.salle} • {c.places_restantes}/{c.capacite_max} places
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.color + "15" }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ── PRÉSENCES ── */}
        {tab === "presences" && (
          <>
            <View style={[styles.infoBox, { backgroundColor: "#10b98110", borderColor: "#10b98130" }]}>
              <Text style={[styles.infoText, { color: "#065f46" }]}>
                ✅ Sélectionnez un cours passé pour enregistrer les présences des membres.
              </Text>
            </View>
            {coursPasses.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30 }]}>
                <Feather name="calendar" size={30} color={colors.mutedForeground} />
                <Text style={[styles.coursInfo, { color: colors.mutedForeground, marginTop: 8, textAlign: "center" }]}>
                  Aucun cours passé approuvé.{"\n"}Les cours doivent d'abord être publiés.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cours passés — sélectionnez un cours</Text>
                {coursPasses.map((c: any) => {
                  const isSelected = selectedCours?.id_cours === c.id_cours;
                  return (
                    <TouchableOpacity key={c.id_cours} onPress={() => handleSelectCours(c)}
                      style={[styles.card, { backgroundColor: isSelected ? colors.primary + "15" : colors.card, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 }]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.coursNom, { color: colors.foreground }]}>{c.type_cours}</Text>
                          <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                            📅 {c.date_cours?.slice(0,10)} · {c.heure_debut?.slice(0,5)} · {c.salle}
                          </Text>
                        </View>
                        {isSelected && <Feather name="check-circle" size={20} color={colors.primary} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {selectedCours && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                      Membres inscrits — {selectedCours.type_cours}
                    </Text>
                    {loadingPresences ? (
                      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", padding: 20 }]}>
                        <Text style={{ color: colors.mutedForeground }}>Chargement...</Text>
                      </View>
                    ) : presencesMembres.length === 0 ? (
                      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", padding: 20 }]}>
                        <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucun membre inscrit à ce cours</Text>
                      </View>
                    ) : (
                      <>
                        {presencesMembres.map((m: any) => {
                          const isPresent = !!presencesState[m.id_reservation];
                          return (
                            <TouchableOpacity key={m.id_reservation}
                              onPress={() => setPresencesState((prev) => ({ ...prev, [m.id_reservation]: !prev[m.id_reservation] }))}
                              style={[styles.card, { backgroundColor: isPresent ? "#10b98110" : colors.card, borderColor: isPresent ? "#10b981" : colors.border, borderWidth: 1.5 }]}
                            >
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <View style={[styles.avatar, { backgroundColor: isPresent ? "#10b98120" : colors.primary + "20" }]}>
                                  <Text style={[styles.avatarText, { color: isPresent ? "#10b981" : colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.coursNom, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                                  <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>{m.telephone || ""}</Text>
                                </View>
                                <View style={[styles.presenceBadge, { backgroundColor: isPresent ? "#10b98120" : colors.background, borderColor: isPresent ? "#10b981" : colors.border }]}>
                                  <Feather name={isPresent ? "check" : "x"} size={16} color={isPresent ? "#10b981" : colors.mutedForeground} />
                                  <Text style={[styles.presenceText, { color: isPresent ? "#10b981" : colors.mutedForeground }]}>{isPresent ? "Présent" : "Absent"}</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                        <EliteButton
                          title={savingPresences ? "Enregistrement..." : "Enregistrer les présences"}
                          onPress={handleMarquerPresences}
                          loading={savingPresences}
                          variant="primary"
                        />
                        <Text style={[styles.coursInfo, { color: colors.mutedForeground, textAlign: "center" }]}>
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

        {/* ── AVIS ── */}
        {tab === "avis" && (
          <>
            {loadingAvis ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 30 }}>Chargement...</Text>
            ) : avisData.moyennes.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
                <Feather name="star" size={36} color={colors.mutedForeground} />
                <Text style={[styles.coursNom, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Aucun avis reçu pour l'instant
                </Text>
                <Text style={[styles.coursInfo, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Les membres peuvent noter vos cours depuis leur onglet Présence.
                </Text>
              </View>
            ) : (
              <>
                {/* Résumé global */}
                {avisData.moyennes.length > 0 && (() => {
                  const total = avisData.moyennes.reduce((s, m) => s + m.nb_avis, 0);
                  const avg = avisData.moyennes.reduce((s, m) => s + m.note_moyenne * m.nb_avis, 0) / total;
                  return (
                    <View style={[styles.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Note globale</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Text style={{ fontSize: 44, fontWeight: "900", color: colors.primary }}>{avg.toFixed(1)}</Text>
                        <View style={{ gap: 4 }}>
                          <Stars note={avg} size={20} />
                          <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                            {total} avis · {avisData.moyennes.length} cours notés
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Liste par cours */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Par cours</Text>
                {avisData.moyennes.map((m: any) => {
                  const avisCours = avisParCours[m.id_cours] || [];
                  const isOpen = selectedAvis === m.id_cours;
                  return (
                    <View key={m.id_cours}>
                      <TouchableOpacity
                        onPress={() => setSelectedAvis(isOpen ? null : m.id_cours)}
                        style={[styles.card, { backgroundColor: colors.card, borderColor: isOpen ? colors.primary : colors.border }]}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[styles.coursNom, { color: colors.foreground }]}>{m.type_cours}</Text>
                            <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                              {m.date_cours?.slice(0,10)} · {m.salle}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                              <Stars note={m.note_moyenne} />
                              <Text style={{ fontSize: 13, fontWeight: "800", color: "#f59e0b" }}>
                                {Number(m.note_moyenne).toFixed(1)}
                              </Text>
                              <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                                ({m.nb_avis} avis)
                              </Text>
                            </View>
                          </View>
                          <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                        </View>

                        {/* Détail avis */}
                        {isOpen && avisCours.length > 0 && (
                          <View style={{ marginTop: 8, gap: 8 }}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            {avisCours.map((a: any) => (
                              <View key={a.id_avis} style={[styles.avisCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                  <Text style={[styles.coursNom, { color: colors.foreground, fontSize: 13 }]}>
                                    {a.membre_nom}
                                  </Text>
                                  <Stars note={a.note} size={12} />
                                </View>
                                {a.commentaire && (
                                  <Text style={[styles.coursInfo, { color: colors.foreground, fontStyle: "italic" }]}>
                                    "{a.commentaire}"
                                  </Text>
                                )}
                                <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                                  {a.date_avis?.slice(0,10)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── MEMBRES ── */}
        {tab === "membres" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Membres ayant réservé vos cours ({membres.length})
            </Text>
            {membres.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun membre encore</Text>
            ) : membres.map((m: any) => (
              <View key={m.id_membre} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.coursNom, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                    <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                      Membre #{m.id_membre} · {m.telephone || m.email}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── SUIVI ── */}
        {tab === "progress" && (
          <>
            <EliteButton title="+ Ajouter une mesure" onPress={() => setShowSuiviModal(true)} variant="primary" />
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Historique des mesures</Text>
            {suivis.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucune mesure enregistrée</Text>
              </View>
            ) : suivis.map((s: any) => (
              <View key={s.id_suivi} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[styles.coursNom, { color: colors.foreground }]}>{s.membre_nom}</Text>
                  <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>{s.date_mesure?.slice(0,10)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {s.poids_kg && <View style={[styles.pill, { backgroundColor: colors.primary + "15" }]}><Text style={[styles.pillText, { color: colors.primary }]}>{s.poids_kg} kg</Text></View>}
                  {s.imc && <View style={[styles.pill, { backgroundColor: "#10b98115" }]}><Text style={[styles.pillText, { color: "#10b981" }]}>IMC {s.imc}</Text></View>}
                  {s.tour_taille && <View style={[styles.pill, { backgroundColor: "#f59e0b15" }]}><Text style={[styles.pillText, { color: "#f59e0b" }]}>{s.tour_taille} cm</Text></View>}
                </View>
                {s.observations && <Text style={[styles.coursInfo, { color: colors.foreground }]}>📝 {s.observations}</Text>}
              </View>
            ))}
          </>
        )}

        {/* ── PARAMÈTRES ── */}
        {tab === "parametres" && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informations du compte</Text>
              {[
                { icon: "user",  label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
                { icon: "shield",label: "Rôle",         value: user?.role },
                { icon: "mail",  label: "Email",         value: user?.email || "—" },
                { icon: "phone", label: "Téléphone",     value: user?.telephone || "—" },
              ].map((item) => (
                <View key={item.label} style={styles.infoRow}>
                  <Feather name={item.icon as any} size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.coursNom, { color: colors.foreground, fontSize: 14 }]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
              <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
              <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
              <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loadingParam} variant="secondary" small />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
              <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>Actuel : {user?.telephone || "—"}</Text>
              <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
              <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loadingParam} variant="secondary" small />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer l'email</Text>
              <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>Actuel : {user?.email || "—"}</Text>
              <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="coach@elitegym.dz" keyboardType="email-address" autoCapitalize="none" />
              <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loadingParam} variant="secondary" small />
            </View>

            <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
          </>
        )}

        {/* ── PROGRAMMES ── */}
        {tab === "exercices" && (
          <>
            <EliteButton title="+ Créer un programme" onPress={() => setShowExerciceModal(true)} variant="primary" />
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Programmes créés</Text>
            {programmes.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucun programme créé</Text>
              </View>
            ) : programmes.map((p: any) => (
              <View key={p.id_programme} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.coursNom, { color: colors.foreground }]}>{p.titre}</Text>
                <Text style={[styles.coursInfo, { color: colors.primary }]}>Pour : {p.membre_nom}</Text>
                {p.description && <Text style={[styles.coursInfo, { color: colors.foreground }]}>{p.description}</Text>}
                <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>Créé le {p.date_creation?.slice(0,10)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal: Nouveau cours */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Soumettre un cours</Text>
              <View style={[styles.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
                <Text style={[styles.infoText, { color: "#b45309" }]}>⚠️ Le cours sera soumis pour approbation admin avant publication.</Text>
              </View>
              <EliteInput label="Type de cours" placeholder="ex: Body Pump" value={form.type_cours} onChangeText={(v) => setForm({ ...form, type_cours: v })} />
              <EliteInput label="Date (YYYY-MM-DD)" placeholder="2026-05-10" value={form.date_cours} onChangeText={(v) => setForm({ ...form, date_cours: v })} />
              <EliteInput label="Heure début (HH:MM)" placeholder="09:00" value={form.heure_debut} onChangeText={(v) => setForm({ ...form, heure_debut: v })} />
              <EliteInput label="Salle" placeholder="Salle A" value={form.salle} onChangeText={(v) => setForm({ ...form, salle: v })} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><EliteInput label="Durée (min)" value={form.duree_minutes} onChangeText={(v) => setForm({ ...form, duree_minutes: v })} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><EliteInput label="Capacité max" value={form.capacite_max} onChangeText={(v) => setForm({ ...form, capacite_max: v })} keyboardType="numeric" /></View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowModal(false)} variant="outline" /></View>
                <View style={{ flex: 1 }}><EliteButton title="Soumettre" onPress={handleAjouterCours} loading={loading} /></View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal: Nouveau programme */}
      <Modal visible={showExerciceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nouveau programme</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Membre</Text>
            {membres.length > 0 ? membres.map((m: any) => (
              <TouchableOpacity key={m.id_membre} onPress={() => setExerciceForm({ ...exerciceForm, id_membre: String(m.id_membre) })}
                style={[styles.selectRow, { borderColor: exerciceForm.id_membre === String(m.id_membre) ? colors.primary : colors.border }]}
              >
                <Text style={[styles.selectText, { color: exerciceForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground }]}>{m.prenom} {m.nom}</Text>
                {exerciceForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
              </TouchableOpacity>
            )) : <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Aucun membre disponible</Text>}
            <EliteInput label="Titre du programme" placeholder="ex: Programme Cardio 4 semaines" value={exerciceForm.titre} onChangeText={(v) => setExerciceForm({ ...exerciceForm, titre: v })} />
            <EliteInput label="Description / exercices" placeholder="Détails du programme..." value={exerciceForm.description} onChangeText={(v) => setExerciceForm({ ...exerciceForm, description: v })} multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowExerciceModal(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title="Créer" onPress={handleAjouterExercice} loading={loading} /></View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Nouvelle mesure */}
      <Modal visible={showSuiviModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nouvelle mesure</Text>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Sélectionner le membre</Text>
              {membres.map((m: any) => (
                <TouchableOpacity key={m.id_membre} onPress={() => setSuiviForm({ ...suiviForm, id_membre: String(m.id_membre) })}
                  style={[styles.selectRow, { borderColor: suiviForm.id_membre === String(m.id_membre) ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.selectText, { color: suiviForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground }]}>{m.prenom} {m.nom}</Text>
                  {suiviForm.id_membre === String(m.id_membre) && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
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
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
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
  divider: { height: 1, marginVertical: 4 },
  avisCard: { borderRadius: 8, padding: 10, borderWidth: 1, gap: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "transparent", paddingVertical: 8 },
  presenceBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  presenceText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  selectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 8, padding: 10 },
  selectText: { fontSize: 14, fontWeight: "600" },
});
