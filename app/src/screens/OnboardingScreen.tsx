import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  PersonStanding,
  Scale,
  Target,
  User as UserIcon,
  Minus,
  Plus,
} from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import { mapUserFromApi } from "../services/mappers";
import { goalOptions } from "../constants";
import { toast } from "../ui/toast";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

export default function OnboardingScreen() {
  const { user, setUser, setOnboardingCompleted } = useAppContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [form, setForm] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    activityLevel: "",
    goal: "maintain",
    dailyCalorieTarget: 2000,
  });

  const set = (k: string, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleNext = async () => {
    if (step === 1) {
      const age = Number(form.age);
      if (!age || age < 13 || age > 120) return toast.error("Âge valide requis");
      if (!form.gender) return toast.error("Sexe requis");
    }
    if (step === 2) {
      if (!Number(form.weight)) return toast.error("Poids requis");
      if (!form.activityLevel) return toast.error("Niveau d'activité requis");
    }
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    try {
      const { data } = await api.put("/users/me", {
        age: Number(form.age),
        gender: form.gender,
        weight: Number(form.weight),
        height: form.height ? Number(form.height) : null,
        activityLevel: form.activityLevel,
        goal: form.goal,
        dailyCalorieTarget: form.dailyCalorieTarget,
      });
      setUser(mapUserFromApi(data.data, user?.token));
      setOnboardingCompleted(true);
      toast.success("Profil configuré !");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la mise à jour");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <PersonStanding size={24} color="#fff" />
          </View>
          <Text style={[styles.brand, { color: colors.text }]}>HealthAI</Text>
        </View>
        <Text style={[styles.lead, { color: colors.textMuted }]}>
          Personnalisons votre expérience
        </Text>

        <View style={styles.progress}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressBar,
                { backgroundColor: s <= step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepText, { color: colors.textMuted }]}>
          Étape {step} sur {totalSteps}
        </Text>

        {step === 1 && (
          <View style={{ gap: 18 }}>
            <StepHeader
              icon={<UserIcon size={22} color={colors.primary} />}
              title="Parlez-nous un peu de vous"
              subtitle="Cela nous aide à personnaliser votre plan"
            />
            <Input
              label="Âge"
              value={form.age}
              onChangeText={(v) => set("age", v)}
              keyboardType="number-pad"
              placeholder="ex. : 28"
            />
            <Select
              label="Sexe"
              value={form.gender}
              onChange={(v) => set("gender", v)}
              options={[
                { value: "male", label: "Homme" },
                { value: "female", label: "Femme" },
                { value: "other", label: "Autre" },
              ]}
            />
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 18 }}>
            <StepHeader
              icon={<Scale size={22} color={colors.primary} />}
              title="Vos mensurations"
              subtitle="Elles servent à personnaliser vos objectifs caloriques"
            />
            <Input
              label="Poids (kg)"
              value={form.weight}
              onChangeText={(v) => set("weight", v)}
              keyboardType="numeric"
              placeholder="ex. : 75"
            />
            <Input
              label="Taille (cm)"
              value={form.height}
              onChangeText={(v) => set("height", v)}
              keyboardType="numeric"
              placeholder="ex. : 178"
            />
            <Select
              label="Niveau d'activité"
              value={form.activityLevel}
              onChange={(v) => set("activityLevel", v)}
              options={[
                { value: "sedentary", label: "Sédentaire" },
                { value: "light", label: "Léger" },
                { value: "moderate", label: "Modéré" },
                { value: "active", label: "Actif" },
                { value: "very_active", label: "Très actif" },
              ]}
            />
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 18 }}>
            <StepHeader
              icon={<Target size={22} color={colors.primary} />}
              title="Quel est votre objectif ?"
              subtitle="Nous adapterons votre expérience"
            />
            <View style={{ gap: 12 }}>
              {goalOptions.map((opt) => {
                const active = form.goal === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => set("goal", opt.value)}
                    style={[
                      styles.goalBtn,
                      {
                        backgroundColor: active ? colors.primarySoft : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.primary : colors.text,
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Objectif calorique quotidien
            </Text>
            <Stepper
              value={form.dailyCalorieTarget}
              min={1200}
              max={4000}
              step={50}
              unit="kcal"
              onChange={(v) => set("dailyCalorieTarget", v)}
            />
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.bg, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        {step > 1 && (
          <Button variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }}>
            <View style={styles.btnInner}>
              <ArrowLeft size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: "600" }}>Retour</Text>
            </View>
          </Button>
        )}
        <Button onPress={handleNext} style={{ flex: 1 }}>
          <View style={styles.btnInner}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {step === totalSteps ? "Commencer" : "Continuer"}
            </Text>
            <ArrowRight size={18} color="#fff" />
          </View>
        </Button>
      </View>
    </View>
  );
}

function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepHeader}>
      <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stepper, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        style={[styles.stepBtn, { backgroundColor: colors.inputBg }]}
      >
        <Minus size={18} color={colors.text} />
      </Pressable>
      <View style={{ alignItems: "center" }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>{value}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{unit}</Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        style={[styles.stepBtn, { backgroundColor: colors.inputBg }]}
      >
        <Plus size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 22, fontWeight: "700" },
  lead: { marginTop: 12, marginBottom: 20 },
  progress: { flexDirection: "row", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 999 },
  stepText: { fontSize: 13, marginTop: 10, marginBottom: 22 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  stepIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 17, fontWeight: "600" },
  stepSubtitle: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  goalBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  stepBtn: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
});
