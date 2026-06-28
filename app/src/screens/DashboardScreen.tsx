import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Flame,
  Beef,
  Activity,
  Zap,
  TrendingUp,
  Scale,
  Ruler,
} from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { getMotivationalMessage, goalEmoji, goalLabels } from "../constants";
import Screen from "../components/Screen";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import CaloriesChart from "../components/CaloriesChart";

export default function DashboardScreen() {
  const { user, allActivityLogs, allFoodLogs, refreshLogs } = useAppContext();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const dailyLimit = user?.dailyCalorieIntake || 2000;
  const burnGoal = user?.dailyCalorieBurn || 400;
  const totalCalories = allFoodLogs.reduce((s, i) => s + i.calories, 0);
  const totalActiveMinutes = allActivityLogs.reduce((s, i) => s + i.duration, 0);
  const totalBurned = allActivityLogs.reduce((s, i) => s + (i.calories || 0), 0);
  const remaining = dailyLimit - totalCalories;
  const motivation = getMotivationalMessage(totalCalories, totalActiveMinutes, dailyLimit);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLogs();
    } finally {
      setRefreshing(false);
    }
  };

  const bmi =
    user?.weight && user?.height
      ? user.weight / Math.pow(user.height / 100, 2)
      : null;
  const bmiColor = (b: number) =>
    b < 18.5 ? colors.blue : b < 25 ? colors.primary : b < 30 ? colors.warning : colors.danger;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <Text style={styles.headerSmall}>Bon retour</Text>
        <Text style={styles.headerTitle}>Bonjour {user?.username} !</Text>
        <View style={styles.motivation}>
          <Text style={{ fontSize: 26 }}>{motivation.emoji}</Text>
          <Text style={styles.motivationText}>{motivation.text}</Text>
        </View>
      </View>

      {/* Calories card */}
      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.iconRow}>
            <IconBubble bg="#ffedd5">
              <Beef size={22} color="#f97316" />
            </IconBubble>
            <View>
              <Text style={[styles.muted, { color: colors.textMuted }]}>Calories consommées</Text>
              <Text style={[styles.bigNum, { color: colors.text }]}>{totalCalories}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.muted, { color: colors.textMuted }]}>Limite</Text>
            <Text style={[styles.bigNum, { color: colors.text }]}>{dailyLimit}</Text>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <ProgressBar value={totalCalories} max={dailyLimit} />
        </View>
        <View style={[styles.rowBetween, { marginTop: 14 }]}>
          <View
            style={[
              styles.badge,
              { backgroundColor: remaining >= 0 ? colors.primarySoft : colors.dangerSoft },
            ]}
          >
            <Text
              style={{
                color: remaining >= 0 ? colors.primary : colors.danger,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {remaining >= 0
                ? `${remaining} kcal restantes`
                : `${Math.abs(remaining)} kcal en trop`}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {Math.round((totalCalories / dailyLimit) * 100)}%
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.rowBetween}>
          <View style={styles.iconRow}>
            <IconBubble bg="#ffedd5">
              <Flame size={22} color="#f97316" />
            </IconBubble>
            <View>
              <Text style={[styles.muted, { color: colors.textMuted }]}>Calories brûlées</Text>
              <Text style={[styles.bigNum, { color: colors.text }]}>{totalBurned}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.muted, { color: colors.textMuted }]}>Objectif</Text>
            <Text style={[styles.bigNum, { color: colors.text }]}>{burnGoal}</Text>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <ProgressBar value={totalBurned} max={burnGoal} color={colors.warning} />
        </View>
      </Card>

      {/* Stats row */}
      <View style={styles.statRow}>
        <Card style={{ flex: 1 }}>
          <IconBubble bg={colors.blueSoft} small>
            <Activity size={18} color={colors.blue} />
          </IconBubble>
          <Text style={[styles.bigNum, { color: colors.text, marginTop: 8 }]}>
            {totalActiveMinutes}
          </Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>minutes aujourd'hui</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <IconBubble bg={colors.blueSoft} small>
            <Zap size={18} color={colors.purple} />
          </IconBubble>
          <Text style={[styles.bigNum, { color: colors.text, marginTop: 8 }]}>
            {allActivityLogs.length}
          </Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>activités enregistrées</Text>
        </Card>
      </View>

      {/* Goal card */}
      {user && (
        <Card style={{ backgroundColor: "#1e293b" }}>
          <View style={styles.iconRow}>
            <IconBubble bg="rgba(255,255,255,0.12)">
              <TrendingUp size={22} color={colors.primary} />
            </IconBubble>
            <View>
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>Votre objectif</Text>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                {goalEmoji[user.goal || "maintain"]} {goalLabels[user.goal || "maintain"]}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Body metrics */}
      {user?.weight ? (
        <Card>
          <View style={[styles.iconRow, { marginBottom: 16 }]}>
            <IconBubble bg="#e0e7ff">
              <Scale size={22} color="#6366f1" />
            </IconBubble>
            <View>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>
                Mensurations
              </Text>
              <Text style={[styles.muted, { color: colors.textMuted }]}>Vos données</Text>
            </View>
          </View>
          <MetricRow icon={<Scale size={16} color={colors.textMuted} />} label="Poids" value={`${user.weight} kg`} />
          {user.height ? (
            <MetricRow icon={<Ruler size={16} color={colors.textMuted} />} label="Taille" value={`${user.height} cm`} />
          ) : null}
          {bmi != null && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.rowBetween}>
                <Text style={{ color: colors.text, fontWeight: "500" }}>IMC</Text>
                <Text style={{ color: bmiColor(bmi), fontWeight: "700", fontSize: 18 }}>
                  {bmi.toFixed(1)}
                </Text>
              </View>
              <View style={styles.bmiScale}>
                <View style={[styles.bmiSeg, { backgroundColor: "#60a5fa" }]} />
                <View style={[styles.bmiSeg, { backgroundColor: "#34d399" }]} />
                <View style={[styles.bmiSeg, { backgroundColor: "#fb923c" }]} />
                <View style={[styles.bmiSeg, { backgroundColor: "#f87171" }]} />
              </View>
            </View>
          )}
        </Card>
      ) : null}

      {/* Summary */}
      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Résumé du jour</Text>
        <SummaryRow label="Repas enregistrés" value={`${allFoodLogs.length}`} border />
        <SummaryRow label="Calories totales" value={`${totalCalories} kcal`} border />
        <SummaryRow label="Temps actif" value={`${totalActiveMinutes} min`} />
      </Card>

      {/* Chart */}
      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Progression de la semaine
        </Text>
        <CaloriesChart />
      </Card>
    </Screen>
  );
}

function IconBubble({
  children,
  bg,
  small,
}: {
  children: React.ReactNode;
  bg: string;
  small?: boolean;
}) {
  const size = small ? 40 : 48;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rowBetween, { marginBottom: 10 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={[styles.miniIcon, { backgroundColor: colors.inputBg }]}>{icon}</View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  border,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.rowBetween,
        styles.summaryRow,
        border && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={{ color: colors.textMuted }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "500" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: 24,
    padding: 22,
  },
  headerSmall: { color: "#d1fae5", fontSize: 13, fontWeight: "500" },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 4 },
  motivation: {
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  motivationText: { color: "#fff", fontWeight: "500", flex: 1 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  muted: { fontSize: 13 },
  bigNum: { fontSize: 22, fontWeight: "700" },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  divider: { height: 1, marginVertical: 16 },
  statRow: { flexDirection: "row", gap: 12 },
  miniIcon: { padding: 6, borderRadius: 8 },
  bmiScale: { flexDirection: "row", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 8 },
  bmiSeg: { flex: 1, opacity: 0.4 },
  cardTitle: { fontWeight: "600", fontSize: 16, marginBottom: 8 },
  summaryRow: { paddingVertical: 12 },
});
