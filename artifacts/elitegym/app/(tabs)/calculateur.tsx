import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import EliteInput from "@/components/EliteInput";
import EliteButton from "@/components/EliteButton";
import { Feather } from "@expo/vector-icons";

type Sexe = "homme" | "femme";
type Objectif = "perte" | "maintien" | "prise";

const OBJECTIFS: { key: Objectif; label: string; coeff: number }[] = [
  { key: "perte", label: "Perte de poids", coeff: 0.8 },
  { key: "maintien", label: "Maintien", coeff: 1.0 },
  { key: "prise", label: "Prise de masse", coeff: 1.15 },
];

const NIVEAUX = [
  { label: "Sédentaire", coeff: 1.2 },
  { label: "Léger (1-3j/sem)", coeff: 1.375 },
  { label: "Modéré (3-5j/sem)", coeff: 1.55 },
  { label: "Intense (6-7j/sem)", coeff: 1.725 },
  { label: "Très intense", coeff: 1.9 },
];

function getBMIInfo(bmi: number) {
  if (bmi < 16) return { label: "Maigreur sévère", color: "#6366f1" };
  if (bmi < 18.5) return { label: "Insuffisance pondérale", color: "#3b82f6" };
  if (bmi < 25) return { label: "Poids normal ✓", color: "#10b981" };
  if (bmi < 30) return { label: "Surpoids", color: "#f59e0b" };
  if (bmi < 35) return { label: "Obésité modérée", color: "#f97316" };
  return { label: "Obésité sévère", color: "#ef4444" };
}

export default function CalculateurScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [taille, setTaille] = useState("");
  const [poids, setPoids] = useState("");
  const [age, setAge] = useState("");
  const [sexe, setSexe] = useState<Sexe>("homme");
  const [niveau, setNiveau] = useState(1);
  const [objectif, setObjectif] = useState<Objectif>("maintien");

  const [bmi, setBmi] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [macros, setMacros] = useState<{ proteines: number; glucides: number; lipides: number } | null>(null);

  const calculate = () => {
    const h = parseFloat(taille);
    const p = parseFloat(poids);
    const a = parseFloat(age);
    if (!h || !p) return;

    const hm = h / 100;
    const imc = p / (hm * hm);
    setBmi(imc);

    if (!a) return;

    // Formule de Mifflin-St Jeor
    let bmr: number;
    if (sexe === "homme") {
      bmr = 10 * p + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * p + 6.25 * h - 5 * a - 161;
    }

    const tdee = bmr * NIVEAUX[niveau].coeff;
    const obj = OBJECTIFS.find((o) => o.key === objectif)!;
    const cals = Math.round(tdee * obj.coeff);
    setCalories(cals);

    // PFC: Protéines / Glucides / Lipides
    const proteines = Math.round((cals * 0.30) / 4); // 30% calories → 4 kcal/g
    const lipides = Math.round((cals * 0.25) / 9);    // 25% calories → 9 kcal/g
    const glucides = Math.round((cals * 0.45) / 4);   // 45% calories → 4 kcal/g
    setMacros({ proteines, glucides, lipides });
  };

  const reset = () => {
    setTaille(""); setPoids(""); setAge("");
    setBmi(null); setCalories(null); setMacros(null);
  };

  const bmiInfo = bmi ? getBMIInfo(bmi) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Calculateur Nutrition</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>IMC • Calories • Protéines/Glucides/Lipides</Text>

      {/* Infos de base */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vos informations</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <EliteInput label="Taille (cm)" placeholder="175" value={taille} onChangeText={setTaille} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <EliteInput label="Poids (kg)" placeholder="70" value={poids} onChangeText={setPoids} keyboardType="numeric" />
          </View>
        </View>

        <EliteInput label="Âge" placeholder="25" value={age} onChangeText={setAge} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.foreground }]}>Sexe</Text>
        <View style={styles.row}>
          {(["homme", "femme"] as Sexe[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSexe(s)}
              style={[styles.chip, { flex: 1, borderColor: sexe === s ? colors.primary : colors.border, backgroundColor: sexe === s ? colors.primary + "15" : "transparent" }]}
            >
              <Text style={[styles.chipText, { color: sexe === s ? colors.primary : colors.mutedForeground }]}>
                {s === "homme" ? "👨 Homme" : "👩 Femme"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Activité */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Niveau d'activité</Text>
        {NIVEAUX.map((n, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setNiveau(i)}
            style={[styles.radioRow, niveau === i && { backgroundColor: colors.primary + "10" }]}
          >
            <View style={[styles.radio, { borderColor: niveau === i ? colors.primary : colors.border }]}>
              {niveau === i && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[styles.radioLabel, { color: niveau === i ? colors.primary : colors.foreground }]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Objectif */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Objectif</Text>
        <View style={styles.row}>
          {OBJECTIFS.map((o) => (
            <TouchableOpacity
              key={o.key}
              onPress={() => setObjectif(o.key)}
              style={[styles.chip, { flex: 1, borderColor: objectif === o.key ? colors.primary : colors.border, backgroundColor: objectif === o.key ? colors.primary + "15" : "transparent" }]}
            >
              <Text style={[styles.chipText, { color: objectif === o.key ? colors.primary : colors.mutedForeground, textAlign: "center" }]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <EliteButton title="Calculer" onPress={calculate} />

      {/* Résultats IMC */}
      {bmi !== null && bmiInfo && (
        <View style={[styles.resultCard, { backgroundColor: bmiInfo.color + "10", borderColor: bmiInfo.color + "40" }]}>
          <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>Votre IMC</Text>
          <Text style={[styles.resultBig, { color: bmiInfo.color }]}>{bmi.toFixed(1)}</Text>
          <Text style={[styles.resultSub, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
          <Text style={[styles.resultHint, { color: colors.mutedForeground }]}>Normal : 18.5 – 24.9</Text>
        </View>
      )}

      {/* Résultats Calories + PFC */}
      {calories !== null && macros && (
        <>
          <View style={[styles.resultCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>Besoins caloriques quotidiens</Text>
            <Text style={[styles.resultBig, { color: colors.primary }]}>{calories} kcal</Text>
            <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
              {OBJECTIFS.find((o) => o.key === objectif)?.label}
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Répartition PFC</Text>
            {[
              { label: "Protéines", value: macros.proteines, unit: "g/jour", color: "#ef4444", desc: "Muscles & récupération" },
              { label: "Glucides", value: macros.glucides, unit: "g/jour", color: "#f59e0b", desc: "Énergie principale" },
              { label: "Lipides", value: macros.lipides, unit: "g/jour", color: "#10b981", desc: "Hormones & vitamines" },
            ].map((m) => (
              <View key={m.label} style={styles.macroRow}>
                <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.macroLabel, { color: colors.foreground }]}>{m.label}</Text>
                  <Text style={[styles.macroDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
                </View>
                <Text style={[styles.macroValue, { color: m.color }]}>{m.value} {m.unit}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conseils alimentation</Text>
            {[
              "🥩 Protéines : poulet, thon, œufs, yaourt grec, légumineuses",
              "🍚 Glucides : riz brun, patate douce, flocons d'avoine, légumes",
              "🥑 Lipides : avocat, huile d'olive, noix, poisson gras",
              "💧 Eau : boire au moins 2L par jour",
              "🥗 Privilégier les aliments non transformés",
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {(bmi !== null || calories !== null) && (
        <EliteButton title="Réinitialiser" onPress={reset} variant="outline" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  pageTitle: { fontSize: 22, fontWeight: "800" },
  pageSub: { fontSize: 13, marginTop: -8 },
  section: { borderRadius: 14, padding: 16, gap: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  label: { fontSize: 13, fontWeight: "600" },
  chip: {
    borderRadius: 10, borderWidth: 1.5,
    paddingVertical: 10, paddingHorizontal: 8,
    alignItems: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  radioRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, padding: 8, borderRadius: 8,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  radioLabel: { fontSize: 13 },
  resultCard: {
    borderRadius: 14, padding: 20, alignItems: "center",
    gap: 6, borderWidth: 1.5,
  },
  resultLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  resultBig: { fontSize: 42, fontWeight: "900" },
  resultSub: { fontSize: 16, fontWeight: "700" },
  resultHint: { fontSize: 12 },
  macroRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 8, borderRadius: 8,
  },
  macroDot: { width: 12, height: 12, borderRadius: 6 },
  macroLabel: { fontSize: 14, fontWeight: "700" },
  macroDesc: { fontSize: 12 },
  macroValue: { fontSize: 15, fontWeight: "800" },
  tipRow: { paddingVertical: 4 },
  tipText: { fontSize: 13, lineHeight: 20 },
});
