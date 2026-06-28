import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Plus, Dumbbell, Activity, Timer, Trash2 } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { quickActivities } from "../constants";
import { activityService } from "../services/activityService";
import { toast } from "../ui/toast";
import Screen from "../components/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PageHeader from "../components/PageHeader";

export default function ActivityLogScreen() {
  const { allActivityLogs, setAllActivityLogs } = useAppContext();
  const { colors } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", duration: "", calories: "" });

  const today = new Date().toISOString().split("T")[0];
  const activities = useMemo(
    () => allActivityLogs.filter((a) => a.createdAt?.split("T")[0] === today),
    [allActivityLogs, today]
  );
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);

  const handleDurationChange = (val: string) => {
    const duration = Number(val);
    const activity = quickActivities.find((a) => a.name === form.name);
    setForm((f) => ({
      ...f,
      duration: val,
      calories: activity ? String(duration * activity.rate) : f.calories,
    }));
  };

  const resetForm = () => setForm({ name: "", duration: "", calories: "" });

  const handleSubmit = async () => {
    if (!form.name.trim() || Number(form.duration) <= 0) {
      return toast.info("Veuillez saisir des données valides");
    }
    try {
      const entry = await activityService.create({
        name: form.name,
        duration: Number(form.duration),
        calories: Number(form.calories) || 0,
      });
      setAllActivityLogs((prev) => [...prev, entry]);
      resetForm();
      setShowForm(false);
      toast.success("Activité ajoutée");
    } catch (error: any) {
      toast.error(error?.message || "Échec de l'ajout de l'activité");
    }
  };

  const handleQuickAdd = (activity: { name: string; rate: number }) => {
    setForm({
      name: activity.name,
      duration: "30",
      calories: String(30 * activity.rate),
    });
    setShowForm(true);
  };

  const handleDelete = (documentId: string) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cette entrée ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await activityService.delete(documentId);
            setAllActivityLogs((prev) => prev.filter((e) => e.documentId !== documentId));
            toast.success("Entrée supprimée");
          } catch {
            toast.error("Échec de la suppression. Veuillez réessayer.");
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <PageHeader
        title="Journal d'activité"
        subtitle="Suivez vos séances"
        rightLabel="Total actif"
        rightValue={`${totalMinutes} min`}
        rightColor={colors.blue}
      />

      {!showForm && (
        <View style={{ gap: 12 }}>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ajout rapide</Text>
            <View style={styles.chips}>
              {quickActivities.map((a) => (
                <Pressable
                  key={a.name}
                  onPress={() => handleQuickAdd(a)}
                  style={[styles.chip, { backgroundColor: colors.inputBg }]}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "500" }}>
                    {a.emoji} {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
          <Button onPress={() => setShowForm(true)}>
            <View style={styles.btnInner}>
              <Plus size={20} color="#fff" />
              <Text style={styles.btnText}>Ajouter une activité</Text>
            </View>
          </Button>
        </View>
      )}

      {showForm && (
        <Card style={{ borderColor: colors.blue, borderWidth: 1.5 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Nouvelle activité</Text>
          <View style={{ gap: 14 }}>
            <Input
              label="Nom de l'activité"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="ex. : Course matinale"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Input
                label="Durée (min)"
                value={form.duration}
                onChangeText={handleDurationChange}
                keyboardType="number-pad"
                placeholder="30"
                style={{ flex: 1 }}
              />
              <Input
                label="Calories brûlées"
                value={form.calories}
                onChangeText={(v) => setForm({ ...form, calories: v })}
                keyboardType="number-pad"
                placeholder="200"
                style={{ flex: 1 }}
              />
            </View>
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

      {activities.length === 0 ? (
        <Card style={{ alignItems: "center", paddingVertical: 40 }}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
            <Dumbbell size={30} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucune activité enregistrée aujourd'hui
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Bougez et suivez votre progression
          </Text>
        </Card>
      ) : (
        <Card>
          <View style={[styles.rowBetween, { marginBottom: 14 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.mealIcon, { backgroundColor: colors.blueSoft }]}>
                <Activity size={18} color={colors.blue} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                  Activités du jour
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {activities.length} enregistrée(s)
                </Text>
              </View>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            {activities.map((activity) => (
              <View
                key={String(activity.id)}
                style={[styles.entry, { backgroundColor: colors.inputBg }]}
              >
                <View style={[styles.smallIcon, { backgroundColor: colors.blueSoft }]}>
                  <Timer size={18} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "500" }}>{activity.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {activity.createdAt
                      ? new Date(activity.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    {activity.duration} min
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {activity.calories} kcal
                  </Text>
                </View>
                <Pressable onPress={() => handleDelete(activity.documentId)} hitSlop={8}>
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={{ color: colors.textMuted }}>Temps actif total</Text>
            <Text style={{ color: colors.blue, fontWeight: "700", fontSize: 18 }}>
              {totalMinutes} minutes
            </Text>
          </View>
        </Card>
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
  smallIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  totalRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
