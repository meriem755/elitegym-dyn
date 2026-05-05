import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Alert, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import { Feather } from "@expo/vector-icons";

function generatePdfHtml(paiement: any, membre: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu — Elite Gym</title>
<style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}
h1{color:#E63946;border-bottom:2px solid #E63946;padding-bottom:10px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
.label{color:#666}.value{font-weight:bold}
.total{font-size:1.4em;color:#E63946;margin-top:10px}
.footer{margin-top:40px;text-align:center;color:#999;font-size:12px}
.badge{display:inline-block;background:#10b98120;color:#10b981;padding:4px 12px;border-radius:6px;font-weight:bold}
</style></head><body>
<h1>🏋️ Elite Gym — Reçu de paiement</h1>
<div class="row"><span class="label">N° Paiement</span><span class="value">#${paiement.id_paiement||"—"}</span></div>
<div class="row"><span class="label">Membre</span><span class="value">${membre?.prenom||""} ${membre?.nom||""}</span></div>
<div class="row"><span class="label">Date</span><span class="value">${new Date(paiement.date_heure||Date.now()).toLocaleString("fr-FR")}</span></div>
<div class="row"><span class="label">Motif</span><span class="value">${paiement.motif||"Abonnement"}${paiement.formule_nom?" — "+paiement.formule_nom:""}</span></div>
<div class="row"><span class="label">Mode de paiement</span><span class="value">${paiement.mode_paiement||"espèces"}</span></div>
<div class="row"><span class="label">Statut</span><span class="value"><span class="badge">✓ Validé</span></span></div>
<div class="row total"><span class="label">MONTANT TOTAL</span><span class="value">${Number(paiement.montant||0).toLocaleString("fr-DZ")} DA</span></div>
<div class="footer">Elite Gym · Reçu généré le ${new Date().toLocaleString("fr-FR")}</div>
</body></html>`;
}

const MODES_PAIEMENT = ["espèces","CIB","BaridiMob","virement","chèque"];

export default function AbonnementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [abonnement, setAbonnement] = useState<any>(null);
  const [formules, setFormules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRenouveler, setShowRenouveler] = useState(false);
  const [selectedFormule, setSelectedFormule] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState("espèces");
  const [renouvLoading, setRenouvLoading] = useState(false);

  const load = async () => {
    if (!user?.id_membre) return;
    try {
      const [p, f] = await Promise.all([
        api.get(`/paiements/membre/${user.id_membre}`),
        api.get("/admin/formules").catch(() => []),
      ]);
      setPaiements(p);
      // Abonnement actif
      const aboResp = await api.get(`/abonnements/membre/${user.id_membre}`).catch(() => null);
      if (aboResp && aboResp.length > 0) {
        const sorted = [...aboResp].sort((a: any, b: any) => new Date(b.date_fin).getTime() - new Date(a.date_fin).getTime());
        setAbonnement(sorted[0]);
      }
      setFormules(f.filter((f: any) => f.actif));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleRenouveler = async () => {
    if (!selectedFormule) { Alert.alert("Erreur", "Sélectionnez une formule"); return; }
    setRenouvLoading(true);
    try {
      // Enregistrer abonnement en ligne + paiement en attente
      const result = await api.post("/abonnements/renouveler", {
        id_membre: user?.id_membre,
        id_util: user?.id,
        id_formule: selectedFormule.id_formule,
        mode_paiement: selectedMode,
        montant: selectedFormule.tarif,
      });
      Alert.alert(
        "Demande envoyée ✓",
        `Votre demande de renouvellement (${selectedFormule.nom} — ${Number(selectedFormule.tarif).toLocaleString()} DA) a été enregistrée.\n\nL'admin validera le paiement.`,
        [{ text: "OK", onPress: () => { setShowRenouveler(false); load(); } }]
      );
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setRenouvLoading(false); }
  };

  const handleExportPdf = (p: any) => {
    const html = generatePdfHtml(p, user);
    if (Platform.OS === "web") {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      Alert.alert("Reçu PDF", `Reçu #${p.id_paiement} — ${Number(p.montant).toLocaleString()} DA\n\nFonction disponible sur la version web.`);
    }
  };

  const aboExpire = abonnement ? new Date(abonnement.date_fin) < new Date() : true;
  const aboResilié = abonnement?.statut === "resilié";
  const jRestants = abonnement && !aboExpire && !aboResilié
    ? Math.ceil((new Date(abonnement.date_fin).getTime() - Date.now()) / 86400000)
    : 0;

  const totalPaye = paiements.filter((p: any) => p.statut === "valide").reduce((s: number, p: any) => s + Number(p.montant), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[ab.topBar, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 }]}>
        <Feather name="credit-card" size={20} color="#fff" />
        <Text style={ab.topBarTitle}>Paiements & Abonnement</Text>
      </View>

      <ScrollView contentContainerStyle={[ab.content, { paddingBottom: 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Abonnement actuel */}
            <View style={[ab.card, {
              backgroundColor: (!abonnement || aboExpire || aboResilié) ? "#ef444410" : "#10b98110",
              borderColor: (!abonnement || aboExpire || aboResilié) ? "#ef444440" : "#10b98140",
              borderWidth: 1.5,
            }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Feather
                  name={(!abonnement || aboExpire || aboResilié) ? "alert-circle" : "check-circle"}
                  size={24}
                  color={(!abonnement || aboExpire || aboResilié) ? "#ef4444" : "#10b981"}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[ab.sectionTitle, { color: colors.foreground }]}>
                    {!abonnement ? "Aucun abonnement" : aboResilié ? "Abonnement résilié" : aboExpire ? "Abonnement expiré" : "Abonnement actif"}
                  </Text>
                  {abonnement && (
                    <>
                      <Text style={[ab.sub, { color: colors.primary, fontWeight: "700" }]}>{abonnement.formule_nom}</Text>
                      <Text style={[ab.sub, { color: colors.mutedForeground }]}>
                        Du {abonnement.date_debut?.slice(0,10)} au {abonnement.date_fin?.slice(0,10)}
                      </Text>
                      {!aboExpire && !aboResilié && (
                        <Text style={[ab.sub, { color: "#10b981", fontWeight: "700" }]}>⏱ {jRestants} jour{jRestants > 1 ? "s" : ""} restant{jRestants > 1 ? "s" : ""}</Text>
                      )}
                    </>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => { setSelectedFormule(null); setShowRenouveler(true); }}
                style={[ab.renouvBtn, { backgroundColor: colors.primary }]}>
                <Feather name="refresh-cw" size={14} color="#fff" />
                <Text style={ab.renouvBtnText}>{(!abonnement || aboExpire || aboResilié) ? "S'abonner en ligne" : "Renouveler"}</Text>
              </TouchableOpacity>
            </View>

            {/* Résumé paiements */}
            {paiements.length > 0 && (
              <View style={[ab.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[ab.sectionTitle, { color: colors.foreground }]}>Résumé des paiements</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[ab.statPill, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[ab.statVal, { color: colors.primary }]}>{totalPaye.toLocaleString()} DA</Text>
                    <Text style={[ab.statLabel, { color: colors.primary }]}>Total payé</Text>
                  </View>
                  <View style={[ab.statPill, { backgroundColor: "#10b98115" }]}>
                    <Text style={[ab.statVal, { color: "#10b981" }]}>{paiements.filter((p: any) => p.statut === "valide").length}</Text>
                    <Text style={[ab.statLabel, { color: "#10b981" }]}>Paiements</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Liste paiements */}
            <Text style={[ab.sectionTitle, { color: colors.foreground }]}>Historique</Text>
            {paiements.length === 0 ? (
              <View style={[ab.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
                <Feather name="credit-card" size={30} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucun paiement enregistré.</Text>
              </View>
            ) : paiements.map((p: any) => (
              <View key={p.id_paiement} style={[ab.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[ab.sectionTitle, { color: colors.foreground, fontSize: 14 }]}>{p.motif || "Paiement"}</Text>
                    {p.formule_nom && <Text style={[ab.sub, { color: colors.primary }]}>{p.formule_nom}</Text>}
                    <Text style={[ab.sub, { color: colors.mutedForeground }]}>
                      {new Date(p.date_heure).toLocaleDateString("fr-FR")} · {p.mode_paiement}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: p.statut === "valide" ? "#10b981" : "#f59e0b" }}>
                      {Number(p.montant).toLocaleString()} DA
                    </Text>
                    <View style={[ab.badge, { backgroundColor: p.statut === "valide" ? "#10b98120" : "#f59e0b20" }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: p.statut === "valide" ? "#10b981" : "#f59e0b" }}>
                        {p.statut === "valide" ? "✓ Validé" : p.statut === "en_attente" ? "⏳ En attente" : p.statut}
                      </Text>
                    </View>
                  </View>
                </View>
                {p.statut === "valide" && (
                  <TouchableOpacity onPress={() => handleExportPdf(p)}
                    style={[ab.pdfBtn, { backgroundColor: "#3b82f615", borderColor: "#3b82f6" }]}>
                    <Feather name="file-text" size={13} color="#3b82f6" />
                    <Text style={{ color: "#3b82f6", fontSize: 12, fontWeight: "700" }}>Télécharger le reçu PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal renouvellement */}
      <Modal visible={showRenouveler} animationType="slide" transparent onRequestClose={() => setShowRenouveler(false)}>
        <View style={ab.overlay}>
          <ScrollView><View style={[ab.sheet, { backgroundColor: colors.card }]}>
            <View style={[ab.handle, { backgroundColor: colors.border }]} />
            <Text style={[ab.modalTitle, { color: colors.foreground }]}>
              {(!abonnement || aboExpire || aboResilié) ? "S'abonner en ligne" : "Renouveler l'abonnement"}
            </Text>
            <Text style={[ab.sub, { color: colors.mutedForeground, textAlign: "center" }]}>
              Sélectionnez une formule. Votre demande sera enregistrée et l'admin validera le paiement.
            </Text>

            {/* Formules */}
            <Text style={[ab.fieldLabel, { color: colors.foreground }]}>Formule *</Text>
            {formules.length === 0 ? (
              <Text style={[ab.sub, { color: colors.mutedForeground, textAlign: "center" }]}>Aucune formule disponible</Text>
            ) : formules.map((f: any) => (
              <TouchableOpacity key={f.id_formule} onPress={() => setSelectedFormule(f)}
                style={[ab.formulaCard, {
                  backgroundColor: selectedFormule?.id_formule === f.id_formule ? colors.primary + "15" : colors.background,
                  borderColor: selectedFormule?.id_formule === f.id_formule ? colors.primary : colors.border,
                  borderWidth: selectedFormule?.id_formule === f.id_formule ? 2 : 1,
                }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[ab.sectionTitle, { color: colors.foreground, fontSize: 14 }]}>{f.nom}</Text>
                  {f.description ? <Text style={[ab.sub, { color: colors.mutedForeground }]}>{f.description}</Text> : null}
                  <Text style={[ab.sub, { color: colors.mutedForeground }]}>{f.duree_jours} jours</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: colors.primary }}>{Number(f.tarif).toLocaleString()} DA</Text>
                  {selectedFormule?.id_formule === f.id_formule && <Feather name="check-circle" size={18} color={colors.primary} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Mode de paiement */}
            <Text style={[ab.fieldLabel, { color: colors.foreground }]}>Mode de paiement</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MODES_PAIEMENT.map((mode) => (
                <TouchableOpacity key={mode} onPress={() => setSelectedMode(mode)}
                  style={[ab.modeBtn, {
                    backgroundColor: selectedMode === mode ? colors.primary : colors.background,
                    borderColor: selectedMode === mode ? colors.primary : colors.border,
                  }]}>
                  <Text style={{ color: selectedMode === mode ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Récap */}
            {selectedFormule && (
              <View style={[ab.recapBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[ab.sub, { color: colors.foreground, fontWeight: "700" }]}>Formule :</Text>
                  <Text style={[ab.sub, { color: colors.foreground }]}>{selectedFormule.nom}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[ab.sub, { color: colors.foreground, fontWeight: "700" }]}>Montant :</Text>
                  <Text style={[ab.sub, { color: colors.primary, fontWeight: "800" }]}>{Number(selectedFormule.tarif).toLocaleString()} DA</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[ab.sub, { color: colors.foreground, fontWeight: "700" }]}>Mode :</Text>
                  <Text style={[ab.sub, { color: colors.foreground }]}>{selectedMode}</Text>
                </View>
              </View>
            )}

            <View style={[ab.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }]}>
              <Feather name="info" size={14} color="#b45309" />
              <Text style={[ab.sub, { color: "#b45309", flex: 1 }]}>
                Votre demande sera enregistrée. L'abonnement sera activé après validation du paiement par l'administrateur. Vous recevrez une notification.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><EliteButton title="Annuler" onPress={() => setShowRenouveler(false)} variant="outline" /></View>
              <View style={{ flex: 1 }}><EliteButton title={renouvLoading ? "Envoi..." : "Confirmer"} onPress={handleRenouveler} loading={renouvLoading} disabled={!selectedFormule} /></View>
            </View>
          </View></ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const ab = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  topBarTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, lineHeight: 18 },
  statPill: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  renouvBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 12, marginTop: 4 },
  renouvBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  pdfBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, paddingVertical: 8, borderWidth: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  fieldLabel: { fontSize: 13, fontWeight: "700" },
  formulaCard: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 12, gap: 10 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  recapBox: { borderRadius: 10, padding: 12, gap: 6, borderWidth: 1 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 8, padding: 10, borderWidth: 1 },
});
