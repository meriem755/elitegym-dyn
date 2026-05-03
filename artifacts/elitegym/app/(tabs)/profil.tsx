import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
  Alert, TouchableOpacity, ActivityIndicator, Modal, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Section = "profil" | "securite" | "progress" | "presence" | "paiements";

function StatPill({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={[sp.pill, { backgroundColor: color + "15" }]}>
      <Text style={[sp.value, { color }]}>{value}</Text>
      <Text style={[sp.label, { color }]}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: { borderRadius: 10, padding: 10, alignItems: "center", flex: 1 },
  value: { fontSize: 18, fontWeight: "900" },
  label: { fontSize: 11, fontWeight: "600", opacity: 0.8 },
});

function StarRow({ note, onSelect, size = 28 }: { note: number; onSelect?: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onSelect?.(n)} disabled={!onSelect} activeOpacity={0.7}>
          <Feather
            name={n <= note ? "star" : "star"}
            size={size}
            color={n <= note ? "#f59e0b" : "#d1d5db"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const CHART_TOTAL = 88;   // hauteur totale px
const CHART_LABEL = 14;   // hauteur label semaine
const CHART_COUNT = 12;   // hauteur compteur
const CHART_GAP   = 6;
const BAR_AREA    = CHART_TOTAL - CHART_LABEL - CHART_COUNT - CHART_GAP * 2; // ≈ 50px

function WeeklyChart({ data, color }: { data: { semaine: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: CHART_TOTAL }}>
      {data.map((d, i) => {
        const barH = Math.max(4, Math.round((d.count / max) * BAR_AREA));
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
            {d.count > 0 && (
              <Text style={{ fontSize: 9, fontWeight: "900", color }}>{d.count}</Text>
            )}
            <View style={{ height: barH, width: "100%", borderRadius: 4, backgroundColor: d.count > 0 ? color : color + "25" }} />
            <Text style={{ fontSize: 9, color: "#9ca3af", fontWeight: "600" }}>{d.semaine.slice(-3)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function groupByMonth(historique: any[]) {
  const groups: Record<string, any[]> = {};
  historique.forEach((r) => {
    const key = r.date_cours?.slice(0, 7) ?? "?";
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
function formatMois(key: string) {
  const [yr, mo] = key.split("-");
  return `${MOIS_FR[parseInt(mo) - 1]} ${yr}`;
}

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const [section, setSection] = useState<Section>("profil");
  const [loading, setLoading] = useState(false);

  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [nouvelEmail, setNouvelEmail] = useState("");

  const [suivis, setSuivis] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const [presenceStats, setPresenceStats] = useState<any>(null);
  const [presenceHistorique, setPresenceHistorique] = useState<any[]>([]);
  const [presenceSemaines, setPresenceSemaines] = useState<any[]>([]);
  const [loadingPresence, setLoadingPresence] = useState(false);

  const [paiements, setPaiements] = useState<any[]>([]);
  const [loadingPaiements, setLoadingPaiements] = useState(false);

  // Avis map: id_cours → { note, commentaire }
  const [avisMap, setAvisMap] = useState<Record<number, { note: number; commentaire: string }>>({});
  // Modal notation
  const [avisTarget, setAvisTarget] = useState<any>(null); // la réservation sélectionnée
  const [avisDraftNote, setAvisDraftNote] = useState(0);
  const [avisDraftComment, setAvisDraftComment] = useState("");
  const [avisLoading, setAvisLoading] = useState(false);

  const loadPaiements = async () => {
    if (!user?.id_membre) return;
    setLoadingPaiements(true);
    try {
      const data = await api.get(`/presences/membre/${user.id_membre}`);
      setPaiements(data);
    } catch {}
    setLoadingPaiements(false);
  };

  useEffect(() => {
    if (section === "progress" && user?.id_membre) loadProgress();
    if (section === "presence" && user?.id_membre) loadPresence();
    if (section === "paiements" && user?.id_membre) loadPaiements();
  }, [section]);

  const loadProgress = async () => {
    if (!user?.id_membre) return;
    setLoadingProgress(true);
    try {
      const [s, p] = await Promise.all([
        api.get(`/progress/membre/${user.id_membre}`),
        api.get(`/exercices/membre/${user.id_membre}`),
      ]);
      setSuivis(s);
      setProgrammes(p);
    } catch {}
    setLoadingProgress(false);
  };

  const loadPresence = async () => {
    if (!user?.id_membre) return;
    setLoadingPresence(true);
    try {
      const [presData, avisData] = await Promise.all([
        api.get(`/reservations/presence/${user.id_membre}`),
        api.get(`/avis/membre/${user.id_membre}`).catch(() => []),
      ]);
      setPresenceStats(presData.stats);
      setPresenceHistorique(presData.historique);
      setPresenceSemaines(presData.activite_semaines);

      const map: Record<number, { note: number; commentaire: string }> = {};
      (avisData as any[]).forEach((a: any) => {
        map[a.id_cours] = { note: a.note, commentaire: a.commentaire || "" };
      });
      setAvisMap(map);
    } catch {}
    setLoadingPresence(false);
  };

  const openAvisModal = (reservation: any) => {
    const existing = avisMap[reservation.id_cours];
    setAvisTarget(reservation);
    setAvisDraftNote(existing?.note ?? 0);
    setAvisDraftComment(existing?.commentaire ?? "");
  };

  const submitAvis = async () => {
    if (!avisTarget || avisDraftNote === 0) {
      Alert.alert("Note requise", "Sélectionnez une note entre 1 et 5 étoiles.");
      return;
    }
    setAvisLoading(true);
    try {
      await api.post("/avis", {
        id_membre: user?.id_membre,
        id_cours: avisTarget.id_cours,
        note: avisDraftNote,
        commentaire: avisDraftComment || undefined,
      });
      setAvisMap((prev) => ({
        ...prev,
        [avisTarget.id_cours]: { note: avisDraftNote, commentaire: avisDraftComment },
      }));
      setAvisTarget(null);
      Alert.alert("Merci !", "Votre avis a bien été enregistré.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
    setAvisLoading(false);
  };

  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert("Erreur", "Remplissez les deux champs"); return; }
    if (nouveauMdp.length < 6) { Alert.alert("Erreur", "Mot de passe trop court (min 6 caractères)"); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { id_util: user?.id, ancien_mdp: ancienMdp, nouveau_mdp: nouveauMdp });
      Alert.alert("Succès", "Mot de passe modifié ✓");
      setAncienMdp(""); setNouveauMdp("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeTel = async () => {
    if (!nouveauTel) return;
    setLoading(true);
    try {
      await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel });
      await updateUser({ telephone: nouveauTel });
      Alert.alert("Succès", "Numéro modifié ✓");
      setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoading(true);
    try {
      await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail });
      await updateUser({ email: nouvelEmail });
      Alert.alert("Succès", "Email modifié ✓");
      setNouvelEmail("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: "profil",   label: "Profil",     icon: "user" },
    { key: "securite", label: "Paramètres", icon: "settings" },
    ...(user?.role === "membre" ? [
      { key: "paiements" as Section, label: "Paiements",  icon: "credit-card" },
      { key: "presence"  as Section, label: "Présence",   icon: "bar-chart-2" },
      { key: "progress"  as Section, label: "Progrès",    icon: "trending-up" },
    ] : []),
  ];

  const groupes = groupByMonth(presenceHistorique);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
        <Text style={styles.role}>{user?.role}</Text>
        {(user?.email || user?.telephone) && (
          <Text style={styles.contact}>{user.email || user.telephone}</Text>
        )}
      </View>

      {/* Tabs scrollables */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { backgroundColor: colors.card, borderColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {SECTIONS.map((s) => (
          <TouchableOpacity key={s.key} onPress={() => setSection(s.key)}
            style={[styles.tabBtn, section === s.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={s.icon as any} size={13} color={section === s.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: section === s.key ? colors.primary : colors.mutedForeground }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── PROFIL ── */}
      {section === "profil" && (
        <>
          {[
            { icon: "user",  label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
            { icon: "shield",label: "Rôle",         value: user?.role },
            { icon: "mail",  label: "Email",         value: user?.email || "—" },
            { icon: "phone", label: "Téléphone",     value: user?.telephone || "—" },
            ...(user?.id_membre ? [{ icon: "hash",  label: "N° Membre", value: `#${user.id_membre}` }] : []),
            ...(user?.id_coach  ? [{ icon: "award", label: "N° Coach",  value: `#${user.id_coach}` }]  : []),
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            </View>
          ))}
          <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
        </>
      )}

      {/* ── PARAMÈTRES ── */}
      {section === "securite" && (
        <>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
            <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
            <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
            <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loading} variant="secondary" small />
          </View>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
            <Text style={[styles.current, { color: colors.mutedForeground }]}>Actuel : {user?.telephone || "—"}</Text>
            <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
            <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loading} variant="secondary" small />
          </View>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer l'email</Text>
            <Text style={[styles.current, { color: colors.mutedForeground }]}>Actuel : {user?.email || "—"}</Text>
            <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
            <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loading} variant="secondary" small />
          </View>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informations de connexion</Text>
            <Text style={[styles.current, { color: colors.mutedForeground }]}>
              Connectez-vous avec votre{" "}
              <Text style={{ fontWeight: "700", color: colors.foreground }}>email</Text> OU votre{" "}
              <Text style={{ fontWeight: "700", color: colors.foreground }}>numéro de téléphone</Text>.{"\n\n"}
              Mot de passe par défaut (nouveaux comptes) :{"\n"}
              <Text style={{ fontWeight: "900", color: colors.primary }}>elitegym2026</Text>
            </Text>
          </View>
        </>
      )}

      {/* ── PRÉSENCE ── */}
      {section === "presence" && user?.role === "membre" && (
        <>
          {loadingPresence ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.current, { color: colors.mutedForeground }]}>Chargement...</Text>
            </View>
          ) : presenceStats ? (
            <>
              {/* Stats */}
              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Résumé global</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <StatPill label="Séances" value={presenceStats.total_seances} color={colors.primary} />
                  <StatPill label="Heures" value={`${presenceStats.total_heures}h`} color="#10b981" />
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <StatPill label="Ce mois" value={`${presenceStats.seances_mois} séances`} color="#f59e0b" />
                  {presenceStats.cours_favori && (
                    <StatPill label="Cours favori" value={presenceStats.cours_favori} color="#8b5cf6" />
                  )}
                </View>
              </View>

              {/* Graphique */}
              {presenceSemaines.length > 0 && (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Activité (8 semaines)</Text>
                    <Text style={[styles.current, { color: colors.mutedForeground }]}>
                      {presenceSemaines.reduce((s: number, d: any) => s + d.count, 0)} séances
                    </Text>
                  </View>
                  <WeeklyChart data={presenceSemaines} color={colors.primary} />
                </View>
              )}

              {/* Réalisations */}
              {presenceStats.total_seances > 0 && (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Réalisations</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { min: 1,   emoji: "🥉", label: "Première séance", color: "#cd7f32" },
                      { min: 5,   emoji: "🥈", label: "5 séances",       color: "#9ca3af" },
                      { min: 10,  emoji: "🥇", label: "10 séances",      color: "#f59e0b" },
                      { min: 25,  emoji: "🏆", label: "25 séances",      color: "#8b5cf6" },
                      { min: 50,  emoji: "🦁", label: "50 séances",      color: "#ef4444" },
                      { min: 100, emoji: "⚡", label: "Centurion 100+",  color: "#e63946" },
                    ].map((a) => {
                      const unlocked = presenceStats.total_seances >= a.min;
                      return (
                        <View key={a.label} style={[styles.achievement, { backgroundColor: unlocked ? a.color + "15" : colors.background, borderColor: unlocked ? a.color + "50" : colors.border }]}>
                          <Text style={{ fontSize: 22, opacity: unlocked ? 1 : 0.25 }}>{a.emoji}</Text>
                          <Text style={[styles.achievLabel, { color: unlocked ? a.color : colors.mutedForeground }]}>{a.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Historique */}
              {groupes.length === 0 ? (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.emptyBlock}>
                    <Feather name="calendar" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.current, { color: colors.mutedForeground, textAlign: "center" }]}>
                      Aucune séance passée.{"\n"}Réservez un cours pour commencer !
                    </Text>
                  </View>
                </View>
              ) : (
                groupes.map(([moisKey, items]) => (
                  <View key={moisKey}>
                    <View style={styles.monthHeader}>
                      <Feather name="calendar" size={13} color={colors.primary} />
                      <Text style={[styles.monthTitle, { color: colors.foreground }]}>{formatMois(moisKey)}</Text>
                      <View style={[styles.monthBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[styles.monthBadgeText, { color: colors.primary }]}>
                          {items.length} séance{items.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>

                    {items.map((r: any) => {
                      const dateObj = new Date(r.date_cours + "T12:00:00");
                      const dayName = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dateObj.getDay()];
                      const mins = r.duree_minutes || 0;
                      const dureeLabel = mins >= 60
                        ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2,"0") : ""}`
                        : `${mins}min`;
                      const existingAvis = avisMap[r.id_cours];

                      return (
                        <View key={r.id_reservation} style={[styles.presenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                            {/* Date badge */}
                            <View style={[styles.dateBadge, { backgroundColor: colors.primary + "15" }]}>
                              <Text style={[styles.dateBadgeDay, { color: colors.primary }]}>{dayName}</Text>
                              <Text style={[styles.dateBadgeNum, { color: colors.primary }]}>{dateObj.getDate()}</Text>
                            </View>

                            {/* Info cours */}
                            <View style={{ flex: 1, gap: 3 }}>
                              <Text style={[styles.coursNom, { color: colors.foreground }]}>{r.type_cours}</Text>
                              <View style={styles.metaRow}>
                                <Feather name="clock" size={11} color={colors.mutedForeground} />
                                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{r.heure_debut?.slice(0,5)} · {dureeLabel}</Text>
                              </View>
                              <View style={styles.metaRow}>
                                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{r.salle}</Text>
                              </View>
                              {r.coach_nom && (
                                <View style={styles.metaRow}>
                                  <Feather name="user" size={11} color={colors.mutedForeground} />
                                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{r.coach_nom}</Text>
                                </View>
                              )}
                            </View>

                            {/* Check */}
                            <View style={[styles.checkBadge, { backgroundColor: "#10b98115" }]}>
                              <Feather name="check-circle" size={18} color="#10b981" />
                            </View>
                          </View>

                          {/* Section avis */}
                          {existingAvis ? (
                            <TouchableOpacity
                              onPress={() => openAvisModal(r)}
                              style={[styles.avisRow, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }]}
                            >
                              <View style={{ flexDirection: "row", gap: 2 }}>
                                {[1,2,3,4,5].map((n) => (
                                  <Feather key={n} name="star" size={14} color={n <= existingAvis.note ? "#f59e0b" : "#d1d5db"} />
                                ))}
                              </View>
                              {existingAvis.commentaire ? (
                                <Text style={styles.avisCommentText} numberOfLines={1}>"{existingAvis.commentaire}"</Text>
                              ) : (
                                <Text style={{ fontSize: 11, color: "#92400e" }}>Modifier mon avis</Text>
                              )}
                              <Feather name="edit-2" size={11} color="#92400e" />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => openAvisModal(r)}
                              style={[styles.avisRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                            >
                              <Feather name="star" size={13} color={colors.mutedForeground} />
                              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Donner un avis sur ce cours</Text>
                              <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </>
          ) : (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.current, { color: colors.mutedForeground, textAlign: "center" }]}>
                Impossible de charger l'historique.
              </Text>
              <EliteButton title="Réessayer" onPress={loadPresence} variant="secondary" small />
            </View>
          )}
        </>
      )}

      {/* ── PAIEMENTS ── */}
      {section === "paiements" && user?.role === "membre" && (
        <>
          {loadingPaiements ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.current, { color: colors.mutedForeground }]}>Chargement...</Text>
            </View>
          ) : paiements.length === 0 ? (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.emptyBlock}>
                <Feather name="credit-card" size={30} color={colors.mutedForeground} />
                <Text style={[styles.current, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Aucun paiement enregistré pour votre compte.
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.section, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Résumé</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[sp.pill, { backgroundColor: colors.primary + "15", flex: 1 }]}>
                    <Text style={[sp.value, { color: colors.primary }]}>
                      {paiements.filter((p: any) => p.statut === "valide").reduce((s: number, p: any) => s + Number(p.montant), 0).toLocaleString()} DA
                    </Text>
                    <Text style={[sp.label, { color: colors.primary }]}>Total payé</Text>
                  </View>
                  <View style={[sp.pill, { backgroundColor: "#10b98115", flex: 1 }]}>
                    <Text style={[sp.value, { color: "#10b981" }]}>{paiements.filter((p: any) => p.statut === "valide").length}</Text>
                    <Text style={[sp.label, { color: "#10b981" }]}>Paiements</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Historique des paiements</Text>
              {paiements.map((p: any) => (
                <View key={p.id_paiement} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, gap: 6 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: 14 }]}>{p.motif || "Paiement"}</Text>
                      {p.formule_nom && (
                        <Text style={[styles.current, { color: colors.primary, fontSize: 12 }]}>{p.formule_nom}</Text>
                      )}
                      <Text style={[styles.current, { color: colors.mutedForeground, fontSize: 12 }]}>
                        {new Date(p.date_heure).toLocaleDateString("fr-FR")} · {p.mode_paiement}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: p.statut === "valide" ? "#10b981" : "#ef4444" }}>
                        {Number(p.montant).toLocaleString()} DA
                      </Text>
                      <View style={[
                        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
                        { backgroundColor: p.statut === "valide" ? "#10b98120" : "#ef444420" },
                      ]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: p.statut === "valide" ? "#10b981" : "#ef4444" }}>
                          {p.statut === "valide" ? "✓ Validé" : p.statut}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}

      {/* ── PROGRÈS ── */}
      {section === "progress" && user?.role === "membre" && (
        <>
          {loadingProgress ? (
            <View style={styles.loadingWrap}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Suivi des performances</Text>
              {suivis.length === 0 ? (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.emptyBlock}>
                    <Feather name="trending-up" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.current, { color: colors.mutedForeground, textAlign: "center" }]}>
                      Aucune mesure enregistrée.{"\n"}Parlez à votre coach pour commencer le suivi.
                    </Text>
                  </View>
                </View>
              ) : suivis.map((s: any) => (
                <View key={s.id_suivi} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.date_mesure?.slice(0,10)}</Text>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>{s.coach_nom}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {s.poids_kg && <StatPill label="Poids" value={`${s.poids_kg} kg`} color={colors.primary} />}
                    {s.imc && <StatPill label="IMC" value={s.imc} color="#10b981" />}
                    {s.tour_taille && <StatPill label="Tour taille" value={`${s.tour_taille} cm`} color="#f59e0b" />}
                  </View>
                  {s.observations && <Text style={[styles.current, { color: colors.foreground }]}>📝 {s.observations}</Text>}
                </View>
              ))}

              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 6 }]}>Programmes d'entraînement</Text>
              {programmes.length === 0 ? (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.emptyBlock}>
                    <Feather name="clipboard" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.current, { color: colors.mutedForeground, textAlign: "center" }]}>
                      Aucun programme assigné.{"\n"}Votre coach peut en créer un pour vous.
                    </Text>
                  </View>
                </View>
              ) : programmes.map((p: any) => (
                <View key={p.id_programme} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{p.titre}</Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>Coach : {p.coach_nom}</Text>
                  {p.description && <Text style={[styles.current, { color: colors.foreground }]}>{p.description}</Text>}
                  <Text style={[styles.current, { color: colors.mutedForeground }]}>Créé le {p.date_creation?.slice(0,10)}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      {/* ── MODAL NOTATION ── */}
      <Modal visible={!!avisTarget} animationType="slide" transparent onRequestClose={() => setAvisTarget(null)}>
        <View style={modal.overlay}>
          <View style={[modal.sheet, { backgroundColor: colors.card }]}>
            {/* Handle */}
            <View style={[modal.handle, { backgroundColor: colors.border }]} />

            <Text style={[modal.title, { color: colors.foreground }]}>
              {avisMap[avisTarget?.id_cours] ? "Modifier mon avis" : "Noter ce cours"}
            </Text>
            <Text style={[modal.subtitle, { color: colors.mutedForeground }]}>
              {avisTarget?.type_cours} · {avisTarget?.date_cours?.slice(0,10)}
            </Text>

            {/* Étoiles */}
            <View style={modal.starsRow}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setAvisDraftNote(n)} activeOpacity={0.7} style={modal.starBtn}>
                  <Feather name="star" size={40} color={n <= avisDraftNote ? "#f59e0b" : "#e5e7eb"} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[modal.noteLabel, { color: colors.mutedForeground }]}>
              {["","Décevant","Peut mieux faire","Bien","Très bien","Excellent !"][avisDraftNote] || "Sélectionnez une note"}
            </Text>

            {/* Commentaire */}
            <Text style={[modal.fieldLabel, { color: colors.foreground }]}>Commentaire (optionnel)</Text>
            <TextInput
              value={avisDraftComment}
              onChangeText={setAvisDraftComment}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                modal.textInput,
                { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                Platform.OS !== "web" && { textAlignVertical: "top" as const },
              ]}
            />

            {/* Boutons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <EliteButton title="Annuler" onPress={() => setAvisTarget(null)} variant="outline" />
              </View>
              <View style={{ flex: 1 }}>
                <EliteButton
                  title={avisLoading ? "Envoi..." : "Envoyer"}
                  onPress={submitAvis}
                  loading={avisLoading}
                  disabled={avisDraftNote === 0}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  header: { borderRadius: 16, padding: 24, alignItems: "center", gap: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  role: { color: "rgba(255,255,255,0.8)", fontSize: 13, textTransform: "capitalize" },
  contact: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  tabsScroll: { borderRadius: 12, borderWidth: 1 },
  tabsContent: { flexDirection: "row" },
  tabBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12, paddingHorizontal: 14 },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  section: { borderRadius: 12, padding: 16, gap: 10, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  current: { fontSize: 13, lineHeight: 20 },
  loadingWrap: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyBlock: { alignItems: "center", gap: 10, paddingVertical: 10 },
  monthHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 2 },
  monthTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  monthBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  monthBadgeText: { fontSize: 11, fontWeight: "700" },
  presenceCard: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  dateBadge: { width: 44, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 1 },
  dateBadgeDay: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  dateBadgeNum: { fontSize: 20, fontWeight: "900" },
  coursNom: { fontSize: 14, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  checkBadge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  achievement: { width: "30%", borderRadius: 10, borderWidth: 1.5, padding: 10, alignItems: "center", gap: 4 },
  achievLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  avisRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 8, borderWidth: 1 },
  avisCommentText: { flex: 1, fontSize: 11, color: "#92400e", fontStyle: "italic" },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, textAlign: "center", marginTop: -6 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 8 },
  starBtn: { padding: 4 },
  noteLabel: { textAlign: "center", fontSize: 13, fontWeight: "600", marginTop: -8 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  textInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, minHeight: 80 },
});
