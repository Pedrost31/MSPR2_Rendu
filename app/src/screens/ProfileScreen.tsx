import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import {
  Calendar,
  Scale,
  Target,
  User as UserIcon,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Sparkles,
} from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { goalLabels, goalOptions } from "../constants";
import { userService } from "../services/userService";
import { aiService } from "../services/aiService";
import {
  setBurnGoal,
  estimateIntake,
  estimateBurnGoal,
  burnGoalFromBmr,
} from "../services/mappers";
import { toast } from "../ui/toast";
import Screen from "../components/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import PageHeader from "../components/PageHeader";

type ProfileForm = {
  age: number;
  weight: number;
  height: number;
  goal: string;
  dailyCalorieIntake: number;
  dailyCalorieBurn: number;
};

export default function ProfileScreen() {
  const { user, logout, fetchUser, allFoodLogs, allActivityLogs, deleteAccount } =
    useAppContext();
  const { colors, mode, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    age: 0,
    weight: 0,
    height: 0,
    goal: "maintain",
    dailyCalorieIntake: 2000,
    dailyCalorieBurn: 400,
  });

  const withEstimates = (next: ProfileForm): ProfileForm => ({
    ...next,
    dailyCalorieIntake: estimateIntake(next),
    dailyCalorieBurn: estimateBurnGoal(next),
  });

  useEffect(() => {
    if (user) {
      setForm({
        age: user.age || 0,
        weight: user.weight || 0,
        height: user.height || 0,
        goal: user.goal || "maintain",
        dailyCalorieIntake: user.dailyCalorieIntake || 2000,
        dailyCalorieBurn: user.dailyCalorieBurn || 400,
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      await setBurnGoal(user.id, form.dailyCalorieBurn);
      const updated = await userService.updateProfile({
        age: form.age,
        weight: form.weight,
        height: form.height,
        goal: form.goal as "lose" | "maintain" | "gain",
        dailyCalorieTarget: form.dailyCalorieIntake,
      });
      await fetchUser(updated.token);
      toast.success("Profil mis à jour");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la mise à jour du profil");
    }
    setIsEditing(false);
  };

  const handleAiCalc = async () => {
    setAiLoading(true);
    toast.info("Calcul des objectifs avec l'IA…");
    try {
      await userService.updateProfile({
        age: form.age,
        weight: form.weight,
        height: form.height,
        goal: form.goal as "lose" | "maintain" | "gain",
      });
      const m = await aiService.getMacros();
      const intake = Math.round(m.calories ?? estimateIntake(form));
      const burn = m.bmr ? burnGoalFromBmr(m.bmr, form.goal) : estimateBurnGoal(form);
      await setBurnGoal(user.id, burn);
      await userService.updateProfile({ dailyCalorieTarget: intake });
      await fetchUser(user.token);
      setForm((f) => ({ ...f, dailyCalorieIntake: intake, dailyCalorieBurn: burn }));
      toast.success(`Objectifs IA : ${intake} kcal/j · ${burn} kcal brûlées`);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec du calcul IA");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              toast.success("Compte supprimé");
            } catch (error: any) {
              toast.error(error?.response?.data?.message || "Échec de la suppression du compte");
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <PageHeader title="Profil" subtitle="Gérez vos paramètres" />

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <UserIcon size={24} color="#fff" />
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>Votre profil</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Membre depuis le {new Date(user.createdAt || "").toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        {isEditing ? (
          <View style={{ gap: 14 }}>
            <Input
              label="Âge"
              value={String(form.age)}
              onChangeText={(v) => setForm(withEstimates({ ...form, age: Number(v) || 0 }))}
              keyboardType="number-pad"
            />
            <Input
              label="Poids (kg)"
              value={String(form.weight)}
              onChangeText={(v) => setForm(withEstimates({ ...form, weight: Number(v) || 0 }))}
              keyboardType="numeric"
            />
            <Input
              label="Taille (cm)"
              value={String(form.height)}
              onChangeText={(v) => setForm(withEstimates({ ...form, height: Number(v) || 0 }))}
              keyboardType="numeric"
            />
            <Select
              label="Objectif"
              value={form.goal}
              onChange={(v) => setForm(withEstimates({ ...form, goal: v }))}
              options={goalOptions}
            />
            <Input
              label="Limite calorique / jour (apport)"
              value={String(form.dailyCalorieIntake)}
              onChangeText={(v) => setForm({ ...form, dailyCalorieIntake: Number(v) || 0 })}
              keyboardType="number-pad"
            />
            <Input
              label="Objectif calories brûlées / jour"
              value={String(form.dailyCalorieBurn)}
              onChangeText={(v) => setForm({ ...form, dailyCalorieBurn: Number(v) || 0 })}
              keyboardType="number-pad"
            />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Les objectifs s'ajustent automatiquement à votre profil. Pour un calcul précis,
              utilisez l'IA.
            </Text>
            <Button variant="secondary" onPress={handleAiCalc} loading={aiLoading}>
              <View style={styles.btnInner}>
                <Sparkles size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Calculer avec l'IA et enregistrer
                </Text>
              </View>
            </Button>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => {
                  setIsEditing(false);
                  setForm({
                    age: user.age || 0,
                    weight: user.weight || 0,
                    height: user.height || 0,
                    goal: user.goal || "maintain",
                    dailyCalorieIntake: user.dailyCalorieIntake || 2000,
                    dailyCalorieBurn: user.dailyCalorieBurn || 400,
                  });
                }}
              >
                Annuler
              </Button>
              <Button style={{ flex: 1 }} onPress={handleSave}>
                Enregistrer
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <InfoRow icon={<Calendar size={18} color={colors.blue} />} bg={colors.blueSoft} label="Âge" value={`${user.age ?? "—"} ans`} />
            <InfoRow icon={<Scale size={18} color={colors.purple} />} bg="#f3e8ff" label="Poids" value={`${user.weight ?? "—"} kg`} />
            {user.height ? (
              <InfoRow icon={<UserIcon size={18} color={colors.primary} />} bg={colors.primarySoft} label="Taille" value={`${user.height} cm`} />
            ) : null}
            <InfoRow icon={<Target size={18} color={colors.warning} />} bg="#ffedd5" label="Objectif" value={goalLabels[user.goal || "maintain"]} />
            <Button variant="secondary" onPress={() => setIsEditing(true)} style={{ marginTop: 4 }}>
              Modifier le profil
            </Button>
          </View>
        )}
      </Card>

      {/* Stats */}
      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Vos statistiques</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={[styles.statBox, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "700" }}>
              {allFoodLogs.length}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Repas enregistrés</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.blueSoft }]}>
            <Text style={{ color: colors.blue, fontSize: 22, fontWeight: "700" }}>
              {allActivityLogs.length}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Activités</Text>
          </View>
        </View>
      </Card>

      {/* Theme toggle */}
      <Pressable
        onPress={toggleTheme}
        style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {mode === "light" ? (
          <Moon size={20} color={colors.text} />
        ) : (
          <Sun size={20} color={colors.text} />
        )}
        <Text style={{ color: colors.text, fontSize: 15 }}>
          {mode === "light" ? "Mode sombre" : "Mode clair"}
        </Text>
      </Pressable>

      {/* Logout */}
      <Button variant="danger" onPress={logout}>
        <View style={styles.btnInner}>
          <LogOut size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600" }}>Se déconnecter</Text>
        </View>
      </Button>

      {/* Delete account */}
      <Pressable onPress={handleDeleteAccount} style={styles.deleteBtn}>
        <Trash2 size={16} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: "600", fontSize: 14 }}>
          Supprimer le compte
        </Text>
      </Pressable>
    </Screen>
  );
}

function InfoRow({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { backgroundColor: colors.inputBg }]}>
      <View style={[styles.infoIcon, { backgroundColor: bg }]}>{icon}</View>
      <View>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: colors.text, fontWeight: "600" }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontWeight: "600", fontSize: 15, marginBottom: 14 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 12,
  },
  infoIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statBox: { flex: 1, alignItems: "center", padding: 16, borderRadius: 14 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
});
