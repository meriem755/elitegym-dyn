import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Platform,
  Alert, Modal, TouchableOpacity, TextInput, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import NotifBanner from "@/components/NotifBanner";
import { Feather } from "@expo/vector-icons";

const PAYMENT_METHODS = [
  {
    id: "cib",
    label: "Carte CIB / Edahabia",
    icon: "credit-card",
    color: "#1a56db",
    desc: "Visa, Mastercard, CIB interbancaire",
  },
  {
    id: "baridimob",
    label: "BaridiMob",
    icon: "smartphone",
    color: "#00a651",
    desc: "Paiement mobile Algérie Poste",
  },
  {
    id: "virement",
    label: "Virement bancaire",
    icon: "repeat",
    color: "#7c3aed",
    desc: "Virement depuis votre banque",
  },
];

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AbonnementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [formules, setFormules] = useState<any[]>([]);
  const [abonnement, setAbonnement] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Paiement
  const [selectedFormule, setSelectedFormule] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState("cib");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const load = async () => {
    try {
      const f = await api.get("/abonnements/formules");
      setFormules(f);
      if (user?.id_membre) {
        const a = await api.get(`/abonnements/membre/${user.id_membre}`);
        const actif = a.find((ab: any) => ab.statut === "actif");
        setAbonnement(actif || null);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleOpenPay = (formule: any) => {
    setSelectedFormule(formule);
    setPaySuccess(false);
    setCardNum(""); setCardExp(""); setCardCvv(""); setCardName("");
    setShowPayModal(true);
  };

  const handlePayer = async () => {
    if (payMethod === "cib") {
      const cleaned = cardNum.replace(/\s/g, "");
      if (cleaned.length < 16) { Alert.alert("Erreur", "Numéro de carte invalide (16 chiffres)"); return; }
      if (!cardExp.match(/^\d{2}\/\d{2}$/)) { Alert.alert("Erreur", "Date d'expiration invalide (MM/AA)"); return; }
      if (cardCvv.length < 3) { Alert.alert("Erreur", "CVV invalide (3 chiffres)"); return; }
      if (!cardName) { Alert.alert("Erreur", "Nom du titulaire requis"); return; }
    }

    setPaying(true);
    // Simulation d'un traitement de paiement (1.5s)
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await api.post("/abonnements", {
        id_membre: user?.id_membre,
        id_formule: selectedFormule.id_formule,
        date_debut: new Date().toISOString().slice(0, 10),
      });
      setPaySuccess(true);
      load();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
    setPaying(false);
  };

  const closePay = () => {
    setShowPayModal(false);
    setPaySuccess(false);
  };

  const joursRestants = abonnement ? daysUntil(abonnement.date_fin) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Abonnements</Text>

      {/* Bannière expiration */}
      {joursRestants !== null && joursRestants <= 7 && joursRestants > 0 && (
        <NotifBanner
          type="warning"
          message={`Votre abonnement "${abonnement.nom}" expire dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""} ! Renouvelez maintenant pour continuer à profiter de la salle.`}
        />
      )}
      {joursRestants !== null && joursRestants <= 0 && (
        <NotifBanner
          type="danger"
          message="Votre abonnement a expiré. Renouvelez votre abonnement pour accéder aux cours."
        />
      )}

      {/* Abonnement actif */}
      {abonnement && joursRestants !== null && joursRestants > 0 && (
        <View style={[styles.currentCard, { backgroundColor: colors.primary }]}>
          <View style={styles.currentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.currentLabel}>Abonnement actif</Text>
              <Text style={styles.currentNom}>{abonnement.nom}</Text>
              <Text style={styles.currentDate}>
                Du {abonnement.date_debut?.slice(0, 10)} au {abonnement.date_fin?.slice(0, 10)}
              </Text>
            </View>
            <View style={styles.joursBox}>
              <Text style={styles.joursNum}>{joursRestants}</Text>
              <Text style={styles.joursLabel}>jours{"\n"}restants</Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <View style={[styles.progressFill, {
              width: `${Math.min(100, Math.max(0, (joursRestants / (abonnement.duree_jours || 30)) * 100))}%`,
              backgroundColor: "rgba(255,255,255,0.9)",
            }]} />
          </View>
        </View>
      )}

      <Text style={[styles.section, { color: colors.foreground }]}>Nos formules</Text>
      <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
        Paiement 100% sécurisé · CIB · BaridiMob · Virement
      </Text>

      {formules.map((f: any) => (
        <View key={f.id_formule} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nom, { color: colors.foreground }]}>{f.nom}</Text>
              <Text style={[styles.duree, { color: colors.mutedForeground }]}>{f.duree_jours} jours</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.prix, { color: colors.primary }]}>{Number(f.tarif).toLocaleString()} DA</Text>
              <Text style={[styles.prixMois, { color: colors.mutedForeground }]}>
                {Math.round(Number(f.tarif) / (f.duree_jours / 30)).toLocaleString()} DA/mois
              </Text>
            </View>
          </View>

          {f.description ? (
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>{f.description}</Text>
          ) : null}

          {/* Avantages */}
          <View style={styles.avantages}>
            {[
              "Accès salle illimité",
              "Vestiaires & douches",
              f.duree_jours >= 90 && "Coach personnel inclus",
              f.duree_jours >= 180 && "Bilan nutritionnel offert",
            ].filter(Boolean).map((a: any) => (
              <View key={a} style={styles.avRow}>
                <Feather name="check" size={12} color="#10b981" />
                <Text style={[styles.avText, { color: colors.mutedForeground }]}>{a}</Text>
              </View>
            ))}
          </View>

          {user?.role === "membre" && (
            <EliteButton
              title={abonnement ? "🔄 Renouveler en ligne" : "💳 Payer en ligne"}
              onPress={() => handleOpenPay(f)}
              variant="primary"
              small
            />
          )}
        </View>
      ))}

      <View style={[styles.secureBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="shield" size={18} color="#10b981" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.secureTitle, { color: colors.foreground }]}>Paiement 100% sécurisé</Text>
          <Text style={[styles.secureText, { color: colors.mutedForeground }]}>
            Vos informations de paiement sont chiffrées et ne sont jamais stockées sur nos serveurs.
            Transactions conformes aux normes PCI-DSS.
          </Text>
        </View>
      </View>

      {/* Modal de paiement */}
      <Modal visible={showPayModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalWrap, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {paySuccess ? (
                <View style={styles.successView}>
                  <View style={styles.successIcon}>
                    <Feather name="check-circle" size={60} color="#10b981" />
                  </View>
                  <Text style={[styles.successTitle, { color: colors.foreground }]}>Paiement validé !</Text>
                  <Text style={[styles.successText, { color: colors.mutedForeground }]}>
                    Votre abonnement <Text style={{ fontWeight: "800", color: colors.primary }}>{selectedFormule?.nom}</Text> est maintenant actif.{"\n"}
                    Confirmation envoyée sur votre numéro enregistré.
                  </Text>
                  <View style={[styles.receiptBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ReceiptRow label="Formule" value={selectedFormule?.nom} />
                    <ReceiptRow label="Montant" value={`${Number(selectedFormule?.tarif).toLocaleString()} DA`} />
                    <ReceiptRow label="Méthode" value={PAYMENT_METHODS.find(m => m.id === payMethod)?.label ?? ""} />
                    <ReceiptRow label="Date" value={new Date().toLocaleDateString("fr-FR")} />
                    <ReceiptRow label="Référence" value={`EG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`} />
                  </View>
                  <EliteButton title="Fermer" onPress={closePay} />
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Paiement en ligne</Text>
                      <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{selectedFormule?.nom}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowPayModal(false)}>
                      <Feather name="x" size={22} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.amountBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.amountText, { color: colors.primary }]}>
                      {Number(selectedFormule?.tarif).toLocaleString()} DA
                    </Text>
                    <Text style={[styles.amountSub, { color: colors.primary + "99" }]}>
                      {selectedFormule?.duree_jours} jours d'accès
                    </Text>
                  </View>

                  {/* Choix méthode */}
                  <Text style={[styles.label, { color: colors.foreground }]}>Méthode de paiement</Text>
                  {PAYMENT_METHODS.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setPayMethod(m.id)}
                      style={[
                        styles.methodBtn,
                        { borderColor: payMethod === m.id ? m.color : colors.border, backgroundColor: payMethod === m.id ? m.color + "10" : colors.card },
                      ]}
                    >
                      <View style={[styles.methodIcon, { backgroundColor: m.color + "20" }]}>
                        <Feather name={m.icon as any} size={18} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodLabel, { color: colors.foreground }]}>{m.label}</Text>
                        <Text style={[styles.methodDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
                      </View>
                      <View style={[styles.methodRadio, { borderColor: payMethod === m.id ? m.color : colors.border }]}>
                        {payMethod === m.id && <View style={[styles.methodRadioDot, { backgroundColor: m.color }]} />}
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Formulaire CIB */}
                  {payMethod === "cib" && (
                    <View style={[styles.cardForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.cardFormTitle, { color: colors.foreground }]}>Informations de carte</Text>

                      <Text style={[styles.label, { color: colors.mutedForeground }]}>Numéro de carte</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                        placeholder="1234  5678  9012  3456"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                        maxLength={19}
                        value={cardNum}
                        onChangeText={(v) => {
                          const clean = v.replace(/\D/g, "").slice(0, 16);
                          setCardNum(clean.replace(/(.{4})/g, "$1 ").trim());
                        }}
                      />

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.label, { color: colors.mutedForeground }]}>Expiration</Text>
                          <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                            placeholder="MM/AA"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="numeric"
                            maxLength={5}
                            value={cardExp}
                            onChangeText={(v) => {
                              const clean = v.replace(/\D/g, "").slice(0, 4);
                              setCardExp(clean.length > 2 ? clean.slice(0, 2) + "/" + clean.slice(2) : clean);
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.label, { color: colors.mutedForeground }]}>CVV</Text>
                          <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                            placeholder="123"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="numeric"
                            maxLength={3}
                            secureTextEntry
                            value={cardCvv}
                            onChangeText={setCardCvv}
                          />
                        </View>
                      </View>

                      <Text style={[styles.label, { color: colors.mutedForeground }]}>Nom du titulaire</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                        placeholder="PRENOM NOM"
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="characters"
                        value={cardName}
                        onChangeText={setCardName}
                      />
                    </View>
                  )}

                  {payMethod === "baridimob" && (
                    <View style={[styles.cardForm, { backgroundColor: "#00a65110", borderColor: "#00a65140" }]}>
                      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                        <Feather name="smartphone" size={18} color="#00a651" style={{ marginTop: 2 }} />
                        <Text style={[styles.altPayText, { color: "#1a5c2a" }]}>
                          Après validation, vous recevrez un SMS de confirmation BaridiMob sur le numéro enregistré dans votre compte EliteGym.{"\n\n"}
                          Code marchand : <Text style={{ fontWeight: "900" }}>ELITEGYM-BJA</Text>
                        </Text>
                      </View>
                    </View>
                  )}

                  {payMethod === "virement" && (
                    <View style={[styles.cardForm, { backgroundColor: "#7c3aed10", borderColor: "#7c3aed40" }]}>
                      <Text style={[styles.cardFormTitle, { color: "#4c1d95" }]}>Coordonnées bancaires</Text>
                      {[
                        ["Bénéficiaire", "ELITE GYM BEJAIA SARL"],
                        ["Banque", "BNA — Agence Béjaïa Centre"],
                        ["RIB", "002 00063 0000 123456789 78"],
                        ["Motif", `Abonnement ${selectedFormule?.nom} — ${user?.prenom} ${user?.nom}`],
                      ].map(([k, v]) => (
                        <View key={k} style={styles.rib}>
                          <Text style={{ fontSize: 11, color: "#7c3aed", fontWeight: "700" }}>{k}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "#4c1d95" }}>{v}</Text>
                        </View>
                      ))}
                      <Text style={{ fontSize: 11, color: "#7c3aed", marginTop: 4 }}>
                        ⚠️ Votre abonnement sera activé après réception du virement (24-48h ouvrables).
                      </Text>
                    </View>
                  )}

                  <View style={styles.secureRow}>
                    <Feather name="lock" size={12} color="#10b981" />
                    <Text style={[styles.secureSmall, { color: colors.mutedForeground }]}>
                      Paiement chiffré SSL 256-bit · PCI-DSS
                    </Text>
                  </View>

                  <EliteButton
                    title={paying ? "Traitement en cours..." : `Payer ${Number(selectedFormule?.tarif).toLocaleString()} DA`}
                    onPress={handlePayer}
                    loading={paying}
                  />
                  <EliteButton title="Annuler" onPress={() => setShowPayModal(false)} variant="outline" />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ fontSize: 13, color: "#6b7280" }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#111" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
  currentCard: { borderRadius: 14, padding: 18, gap: 10 },
  currentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  currentLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  currentNom: { color: "#fff", fontSize: 20, fontWeight: "800" },
  currentDate: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  joursBox: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 10 },
  joursNum: { color: "#fff", fontSize: 28, fontWeight: "900" },
  joursLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, textAlign: "center" },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  section: { fontSize: 17, fontWeight: "700" },
  sectionSub: { fontSize: 12, marginTop: -8 },
  card: { borderRadius: 14, padding: 16, gap: 10, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  nom: { fontSize: 17, fontWeight: "700" },
  duree: { fontSize: 13 },
  prix: { fontSize: 20, fontWeight: "900" },
  prixMois: { fontSize: 11 },
  desc: { fontSize: 13, lineHeight: 20 },
  avantages: { gap: 4 },
  avRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avText: { fontSize: 12 },
  secureBox: { flexDirection: "row", gap: 10, borderRadius: 12, padding: 14, borderWidth: 1, alignItems: "flex-start" },
  secureTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  secureText: { fontSize: 12, lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalWrap: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "92%", gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalSub: { fontSize: 13, marginTop: 2 },
  amountBadge: { borderRadius: 12, padding: 16, alignItems: "center", gap: 2 },
  amountText: { fontSize: 30, fontWeight: "900" },
  amountSub: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  methodBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1.5, padding: 12,
  },
  methodIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  methodLabel: { fontSize: 14, fontWeight: "700" },
  methodDesc: { fontSize: 11, marginTop: 1 },
  methodRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  methodRadioDot: { width: 10, height: 10, borderRadius: 5 },
  cardForm: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  cardFormTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, marginBottom: 2,
  },
  altPayText: { flex: 1, fontSize: 13, lineHeight: 20 },
  rib: { gap: 2, borderBottomWidth: 1, borderBottomColor: "#7c3aed20", paddingBottom: 6 },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" },
  secureSmall: { fontSize: 11 },
  successView: { alignItems: "center", gap: 14, paddingVertical: 10 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "900" },
  successText: { textAlign: "center", fontSize: 14, lineHeight: 22 },
  receiptBox: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 14, gap: 2 },
});
