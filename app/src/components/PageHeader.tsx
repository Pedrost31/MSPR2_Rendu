import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function PageHeader({
  title,
  subtitle,
  rightLabel,
  rightValue,
  rightColor,
  icon,
}: {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  rightValue?: string;
  rightColor?: string;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightValue ? (
        <View style={{ alignItems: "flex-end" }}>
          {rightLabel ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{rightLabel}</Text>
          ) : null}
          <Text style={[styles.rightValue, { color: rightColor ?? colors.text }]}>
            {rightValue}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  rightValue: { fontSize: 18, fontWeight: "700" },
});
