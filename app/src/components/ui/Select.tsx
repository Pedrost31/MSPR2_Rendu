import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

interface Option {
  value: string;
  label: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  style,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={style}>
      {label ? (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          { backgroundColor: colors.inputBg, borderColor: colors.border },
        ]}
      >
        <Text
          style={{
            color: selected ? colors.text : colors.textMuted,
            fontSize: 15,
          }}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    active && { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: 15 }}>
                    {opt.label}
                  </Text>
                  {active ? <Check size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  field: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 16,
    overflow: "hidden",
    paddingVertical: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});
