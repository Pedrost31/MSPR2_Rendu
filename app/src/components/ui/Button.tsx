import React from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

type Variant = "primary" | "secondary" | "danger";

export default function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : colors.card;
  const fg =
    variant === "secondary" ? colors.text : "#ffffff";
  const border = variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "secondary" ? 1 : 0,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {typeof children === "string" ? (
            <Text style={[styles.text, { color: fg }]}>{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
});
