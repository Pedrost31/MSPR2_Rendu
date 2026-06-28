import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Plus, Sparkles, Trash2, UtensilsCrossed } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import {
  mealColors,
  mealIcons,
  mealLabels,
  mealTypeOptions,
  quickActivitiesFoodLog,
  type MealKey,
} from "../constants";
import { foodService } from "../services/foodService";
import { aiService, uriToCompressedBase64 } from "../services/aiService";
import { toast } from "../ui/toast";
import type { FoodEntry } from "../types";
import Screen from "../components/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import PageHeader from "../components/PageHeader";

export default function FoodLogScreen() {
  const { allFoodLogs, setAllFoodLogs } = useAppContext();
  const { colors } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", calories: "", mealType: "" });
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const entries = useMemo(
    () => allFoodLogs.filter((e) => e.createdAt?.split("T")[0] === today),
    [allFoodLogs, today]
  );
  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);

  const grouped = useMemo(() => {
    const acc: Record<MealKey, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const e of entries) acc[e.mealType]?.push(e);
    return acc;
  }, [entries]);

  const resetForm = () => setForm({ name: "", calories: "", mealType: "" });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.mealType) {
      return toast.error("Renseignez le nom et le type de repas");
    }
    try {
      const entry = await foodService.create({
        name: form.name,
        calories: Number(form.calories) || 0,
        mealType: form.mealType,
      });
      setAllFoodLogs((prev) => [...prev, entry]);
      resetForm();
      setShowForm(false);
      toast.success("Repas ajouté");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de l'ajout du repas");
    }
  };

  const handleQuickAdd = (mealType: string) => {
    setForm((f) => ({ ...f, mealType }));
    setShowForm(true);
  };

  const analyzeImage = async (mode: "camera" | "library") => {
    const perm =
      mode === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return toast.error("Permission refusée");
    }
    const result =
      mode === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLoading(true);
    toast.info("Analyse de l'image en cours… (jusqu'à 1-2 min)");
    try {
      const base64 = await uriToCompressedBase64(asset.uri, asset.width);
      const analysis = await aiService.analyzeFoodImage(base64);
      const detectedName = analysis.food_name?.trim();
      const rawCalories = Number(analysis.nutrition?.calories);
      const detectedCalories = Number.isFinite(rawCalories) ? Math.round(rawCalories) : 0;

      if (!detectedName) {
        toast.error("Aucun aliment reconnu. Essayez une autre photo.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        name: detectedName,
        calories: detectedCalories ? String(detectedCalories) : "",
      }));
      setShowForm(true);
      if (detectedCalories > 0) {
        toast.success(`Détecté : ${detectedName} (~${detectedCalories} kcal)`);
      } else {
        toast.info(`Détecté : ${detectedName}`, "Calories non estimées, saisissez-les.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de l'analyse de l'image");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = () => {
    Alert.alert("Photo repas IA", "Analyser une image de votre repas", [
      { text: "Prendre une photo", onPress: () => analyzeImage("camera") },
      { text: "Choisir dans la galerie", onPress: () => analyzeImage("library") },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const handleDelete = (documentId: string) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cette entrée ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await foodService.delete(documentId);
            setAllFoodLogs((prev) => prev.filter((e) => e.documentId !== documentId));
            toast.success("Entrée supprimée");
          } catch {
            toast.error("Échec de la suppression. Veuillez réessayer.");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (!showForm) return;
  }, [showForm]);

  return (
    <Screen>
      <PageHeader
        title="Journal alimentaire"
        subtitle="Suivez vos apports quotidiens"
        rightLabel="Total du jour"
        rightValue={`${totalCalories} kcal`}
        rightColor={colors.primary}
      />

      {!showForm && (
        <View style={{ gap: 12 }}>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ajout rapide</Text>
            <View style={styles.chips}>
              {quickActivitiesFoodLog.map((a) => (
                <Pressable
                  key={a.name}
                  onPress={() => handleQuickAdd(a.name)}
                  style={[styles.chip, { backgroundColor: colors.inputBg }]}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "500" }}>
                    {a.emoji} {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Button onPress={() => setShowForm(true)}>
            <View style={styles.btnInner}>
              <Plus size={20} color="#fff" />
              <Text style={styles.btnText}>Ajouter un repas</Text>
            </View>
          </Button>

          <Button variant="secondary" onPress={pickImage}>
            <View style={styles.btnInner}>
              <Sparkles size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: "600" }}>Photo repas IA</Text>
            </View>
          </Button>
        </View>
      )}

      {showForm && (
        <Card style={{ borderColor: colors.primary, borderWidth: 1.5 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Nouveau repas</Text>
          <View style={{ gap: 14 }}>
            <Input
              label="Nom de l'aliment"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="ex. : Salade de poulet grillé"
            />
            <Input
              label="Calories"
              value={form.calories}
              onChangeText={(v) => setForm({ ...form, calories: v })}
              keyboardType="number-pad"
              placeholder="ex. : 350"
            />
            <Select
              label="Type de repas"
              value={form.mealType}
              onChange={(v) => setForm({ ...form, mealType: v })}
              options={mealTypeOptions}
              placeholder="Choisir un type de repas"
            />
            <View style={styles.formActions}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button style={{ flex: 1 }} onPress={handleSubmit}>
                Ajouter
              </Button>
            </View>
          </View>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card style={{ alignItems: "center", paddingVertical: 40 }}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
            <UtensilsCrossed size={30} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucun repas enregistré aujourd'hui
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>
            Commencez à suivre vos repas pour rester sur la bonne voie
          </Text>
        </Card>
      ) : (
        (["breakfast", "lunch", "dinner", "snack"] as MealKey[]).map((mealKey) => {
          const list = grouped[mealKey];
          if (!list || list.length === 0) return null;
          const MealIcon = mealIcons[mealKey];
          const mealCals = list.reduce((s, e) => s + e.calories, 0);
          return (
            <Card key={mealKey}>
              <View style={[styles.rowBetween, { marginBottom: 12 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.mealIcon, { backgroundColor: mealColors[mealKey].bg }]}>
                    <MealIcon size={18} color={mealColors[mealKey].fg} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                      {mealLabels[mealKey]}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {list.length} élément(s)
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{mealCals} kcal</Text>
              </View>
              <View style={{ gap: 8 }}>
                {list.map((entry) => (
                  <View
                    key={String(entry.id)}
                    style={[styles.entry, { backgroundColor: colors.inputBg }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: "500", flex: 1 }}>
                      {entry.name}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontWeight: "500" }}>
                      {entry.calories} kcal
                    </Text>
                    <Pressable onPress={() => handleDelete(entry.documentId || "")} hitSlop={8}>
                      <Trash2 size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Card>
          );
        })
      )}

      {loading && (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 12, fontWeight: "500" }}>
            Analyse en cours…
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontWeight: "600", fontSize: 15, marginBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  formActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontWeight: "600", fontSize: 15, marginBottom: 6 },
  mealIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
