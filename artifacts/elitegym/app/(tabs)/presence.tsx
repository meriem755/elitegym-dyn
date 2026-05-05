import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, TouchableOpacity, ActivityIndicator, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import { Feather } from "@expo/vector-icons";

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
function formatMois(key: string) {
  const [yr, mo] = key.split("-");
  return `${MOIS_FR[parseInt(mo) - 1]} ${yr}`;
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

const BAR_AREA = 50;
function WeeklyChart({ data, color }: { data: { semaine: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 88 }}>
      {data.map((d, i) => {
        const barH = Math.max(4, Math.round((d.count / max) * BAR_AREA));
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
            {d.count > 0 && <Text style={{ fontSize: 9, fontWeight: "900", color }}>{d.count}</Text>}
            <View style={{ height: barH, width: "100%", borderRadius: 4, backgroundColor: d.count > 0 ? color : color + "25" }} />
            <Text style={{ fontSize: 9, color: "#9ca3af", fontWeight: "600" }}>{d.semaine.slice(-3)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function PresenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [historique, setHistorique] = useState<any[]>([]);
  const [semaines, setSemaines] = useState<any[]>([]);
  const [avisMap, setAvisMap] = useState<Record<number, { note: number; commentaire: string }>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avisTarget, setAvisTarget] = useState<any>(null);
  const [avisDraftNote, setAvisDraftNote] = useState(0);
  const [avisDraftComment, setAvisDraftComment] = useState("");
  const [avisLoading, setAvisLoading] = useState(false);

  const load = async () => {
    if (!user?.id_membre) return;
    try {
      const [presData, avisData] = await Promise.all([
        api.get(`/reservations/presence/${user.id_membre}`),
        api.get(`/avis/membre/${user.id_membre}`).catch(() => []),
      ]);
      setStats(presData.stats);
      setHistorique(presData.historique);
      setSemaines(presData.activite_semaines);
      const map: Record<number, { note: number; commentaire: string }> = {};
      (avisData as any[]).forEach((a: any) => {
        map[a.id_cours] = { note: a.note, commentaire: a.commentaire || "" };
      });
      setAvisMap(map);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openAvisModal = (r: any) => {
    const existing = avisMap[r.id_cours];
    setAvisTarget(r);
    setAvisDraftNote(existing?.note ?? 0);
    setAvisDraftComment(existing?.commentaire ?? "");
  };

  const submitAvis = async () => {
    if (!avisTarget || avisDraftNote === 0) return;
    setAvisLoading(true);
    try {
      await api.post("/avis", {
        id_membre: user?.id_membre,
        id_cours: avisTarget.id_cours,
        note: avisDraftNote,
        commentaire: avisDraftComment || undefined,
      });
      setAvisMap((prev) => ({ ...prev, [avisTarget.id_cours]: { note: avisDraftNote, commentaire: avisDraftComment } }));
      setAvisTarget(null);
    } catch (e: any) {}
    setAvisLoading(false);
  };

  const groupes = groupByMonth(historique);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.topBar, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 }]}>
        <Feather name="bar-chart-2" size={20} color="#fff" />
        <Text style={s.topBarTitle}>Mes Présences</Text>
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : !stats ? (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30 }]}>
            <Feather name="alert-circle" size={30} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Impossible de charger les données</Text>
            <EliteButton title="Réessayer" onPress={load} variant="secondary" small />
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={[s.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Résumé global</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={[s.statPill, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[s.statVal, { color: colors.primary }]}>{stats.total_seances}</Text>
                  <Text style={[s.statLabel, { color: colors.primary }]}>Séances</Text>
                </View>
                <View style={[s.statPill, { backgroundColor: "#10b98115" }]}>
                  <Text style={[s.statVal, { color: "#10b981" }]}>{stats.total_heures}h</Text>
                  <Text style={[s.statLabel, { color: "#10b981" }]}>Heures</Text>
                </View>
                <View style={[s.statPill, { backgroundColor: "#f59e0b15" }]}>
                  <Text style={[s.statVal, { color: "#f59e0b" }]}>{stats.seances_mois}</Text>
                  <Text style={[s.statLabel, { color: "#f59e0b" }]}>Ce mois</Text>
                </View>
              </View>
              {stats.cours_favori && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Feather name="award" size={14} color="#8b5cf6" />
                  <Text style={{ color: "#8b5cf6", fontWeight: "700", fontSize: 13 }}>Cours favori : {stats.cours_favori}</Text>
                </View>
              )}
            </View>

            {/* Graphique */}
            {semaines.length > 0 && (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Activité (8 semaines)</Text>
                <WeeklyChart data={semaines} color={colors.primary} />
              </View>
            )}

            {/* Réalisations */}
            {stats.total_seances > 0 && (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Réalisations</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { min: 1,   emoji: "🥉", label: "1ère séance", color: "#cd7f32" },
                    { min: 5,   emoji: "🥈", label: "5 séances",   color: "#9ca3af" },
                    { min: 10,  emoji: "🥇", label: "10 séances",  color: "#f59e0b" },
                    { min: 25,  emoji: "🏆", label: "25 séances",  color: "#8b5cf6" },
                    { min: 50,  emoji: "🦁", label: "50 séances",  color: "#ef4444" },
                    { min: 100, emoji: "⚡", label: "Centurion",   color: "#e63946" },
                  ].map((a) => {
                    const ok = stats.total_seances >= a.min;
                    return (
                      <View key={a.label} style={[s.achiev, { backgroundColor: ok ? a.color + "15" : colors.background, borderColor: ok ? a.color + "50" : colors.border }]}>
                        <Text style={{ fontSize: 22, opacity: ok ? 1 : 0.2 }}>{a.emoji}</Text>
                        <Text style={[s.achievLabel, { color: ok ? a.color : colors.mutedForeground }]}>{a.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Historique */}
            {groupes.length === 0 ? (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
                <Feather name="calendar" size={30} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucune séance passée.{"\n"}Réservez un cours pour commencer !</Text>
              </View>
            ) : groupes.map(([moisKey, items]) => (
              <View key={moisKey}>
                <View style={s.monthRow}>
                  <Feather name="calendar" size={13} color={colors.primary} />
                  <Text style={[s.monthTitle, { color: colors.foreground }]}>{formatMois(moisKey)}</Text>
                  <View style={[s.monthBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[s.monthBadgeText, { color: colors.primary }]}>{items.length} séance{items.length > 1 ? "s" : ""}</Text>
                  </View>
                </View>
                {items.map((r: any) => {
                  const dateObj = new Date(r.date_cours + "T12:00:00");
                  const dayName = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dateObj.getDay()];
                  const mins = r.duree_minutes || 0;
                  const dureeLabel = mins >= 60 ? `${Math.floor(mins/60)}h${mins%60>0?String(mins%60).padStart(2,"0"):""}` : `${mins}min`;
                  const existingAvis = avisMap[r.id_cours];
                  return (
                    <View key={r.id_reservation} style={[s.presCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                        <View style={[s.dateBadge, { backgroundColor: colors.primary + "15" }]}>
                          <Text style={[s.dateBadgeDay, { color: colors.primary }]}>{dayName}</Text>
                          <Text style={[s.dateBadgeNum, { color: colors.primary }]}>{dateObj.getDate()}</Text>
                        </View>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={[s.coursNom, { color: colors.foreground }]}>{r.type_cours}</Text>
                          <View style={s.metaRow}>
                            <Feather name="clock" size={11} color={colors.mutedForeground} />
                            <Text style={[s.metaText, { color: colors.mutedForeground }]}>{r.heure_debut?.slice(0,5)} · {dureeLabel}</Text>
                          </View>
                          <View style={s.metaRow}>
                            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                            <Text style={[s.metaText, { color: colors.mutedForeground }]}>{r.salle}</Text>
                          </View>
                          {r.coach_nom && (
                            <View style={s.metaRow}>
                              <Feather name="user" size={11} color={colors.mutedForeground} />
                              <Text style={[s.metaText, { color: colors.mutedForeground }]}>{r.coach_nom}</Text>
                            </View>
                          )}
                        </View>
                        <View style={[s.checkBadge, { backgroundColor: "#10b98115" }]}>
                          <Feather name="check-circle" size={18} color="#10b981" />
                        </View>
                      </View>
                      {/* Avis */}
                      {existingAvis ? (
                        <TouchableOpacity onPress={() => openAvisModal(r)}
                          style={[s.avisRow, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }]}>
                          <View style={{ flexDirection: "row", gap: 2 }}>
                            {[1,2,3,4,5].map((n) => <Feather key={n} name="star" size={13} color={n <= existingAvis.note ? "#f59e0b" : "#d1d5db"} />)}
                          </View>
                          {existingAvis.commentaire
                            ? <Text style={{ flex: 1, fontSize: 11, color: "#92400e", fontStyle: "italic" }} numberOfLines={1}>"{existingAvis.commentaire}"</Text>
                            : <Text style={{ fontSize: 11, color: "#92400e" }}>Modifier mon avis</Text>
                          }
                          <Feather name="edit-2" size={11} color="#92400e" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => openAvisModal(r)}
                          style={[s.avisRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Feather name="star" size={13} color={colors.mutedForeground} />
                          <Text style={[s.metaText, { color: colors.mutedForeground }]}>Donner un avis sur ce cours</Text>
                          <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal avis */}
      <Modal visible={!!avisTarget} animationType="slide" transparent onRequestClose={() => setAvisTarget(null)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { backgroundColor: colors.card }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.foreground }]}>{avisMap[avisTarget?.id_cours] ? "Modifier mon avis" : "Noter ce cours"}</Text>
            <Text style={[s.metaText, { color: colors.mutedForeground, textAlign: "center" }]}>{avisTarget?.type_cours} · {avisTarget?.date_cours?.slice(0,10)}</Text>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, paddingVertical: 8 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setAvisDraftNote(n)}>
                  <Feather name="star" size={40} color={n <= avisDraftNote ? "#f59e0b" : "#e5e7eb"} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.metaText, { color: colors.mutedForeground, textAlign: "center" }]}>
              {["","Décevant","Peut mieux faire","Bien","Très bien","Excellent !"][avisDraftNote] || "Sélectionnez une note"}
            </Text>
            <TextInput
              value={avisDraftComment}
              onChangeText={setAvisDraftComment}
              placeholder="Commentaire (optionnel)..."
              placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={3}
              style={[s.textInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setAvisTarget(null)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title={avisLoading ? "Envoi..." : "Envoyer"} onPress={submitAvis} loading={avisLoading} disabled={avisDraftNote === 0} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  topBarTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  statPill: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  monthRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 2 },
  monthTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  monthBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  monthBadgeText: { fontSize: 11, fontWeight: "700" },
  presCard: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  dateBadge: { width: 44, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 1 },
  dateBadgeDay: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  dateBadgeNum: { fontSize: 20, fontWeight: "900" },
  coursNom: { fontSize: 14, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  checkBadge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  achiev: { width: "30%", borderRadius: 10, borderWidth: 1.5, padding: 10, alignItems: "center", gap: 4 },
  achievLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  avisRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 8, borderWidth: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  textInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, minHeight: 80 },
});
