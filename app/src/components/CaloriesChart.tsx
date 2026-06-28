import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

export default function CaloriesChart() {
  const { allActivityLogs, allFoodLogs } = useAppContext();
  const { colors } = useTheme();

  const today = new Date();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split("T")[0];
    const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" });

    const intake = allFoodLogs
      .filter((log) => log.createdAt?.split("T")[0] === dateString)
      .reduce((sum, item) => sum + item.calories, 0);
    const burn = allActivityLogs
      .filter((log) => log.createdAt?.split("T")[0] === dateString)
      .reduce((sum, item) => sum + (item.calories || 0), 0);

    data.push({ name: dayName, intake, burn });
  }

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.intake, d.burn)));
  const chartHeight = 160;

  return (
    <View style={styles.wrap}>
      <View style={[styles.bars, { height: chartHeight }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.dayColumn}>
            <View style={styles.barPair}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(2, (d.intake / maxVal) * chartHeight),
                    backgroundColor: colors.primary,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(2, (d.burn / maxVal) * chartHeight),
                    backgroundColor: colors.warning,
                  },
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
              {d.name}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Apports</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Dépense</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  dayColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: "100%",
  },
  bar: { width: 9, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  dayLabel: { fontSize: 11, marginTop: 6 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
});
