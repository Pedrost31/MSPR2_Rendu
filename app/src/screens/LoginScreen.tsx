import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { Eye, EyeOff, HeartPulse } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function LoginScreen() {
  const { login, signup } = useAppContext();
  const { colors } = useTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await signup({ username, email, password });
      }
    } catch {
      // erreur gérée par toast dans le contexte
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <HeartPulse size={32} color="#fff" />
        </View>
        <Text style={[styles.brand, { color: colors.text }]}>HealthAI Coach</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === "login" ? "Connexion" : "Inscription"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {mode === "login"
              ? "Heureux de vous revoir"
              : "Créez votre compte en quelques secondes"}
          </Text>

          {mode === "signup" && (
            <Input
              label="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              placeholder="choisissez un nom d'utilisateur"
              autoCapitalize="none"
              style={styles.field}
            />
          )}

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="saisissez votre e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.field}
          />

          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="saisissez votre mot de passe"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.field}
            rightElement={
              <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </Pressable>
            }
          />

          <Button
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: 8 }}
          >
            {mode === "login" ? "Se connecter" : "S'inscrire"}
          </Button>

          <View style={styles.switchRow}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              {mode === "login" ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}
            </Text>
            <Pressable
              onPress={() => setMode(mode === "login" ? "signup" : "login")}
            >
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
                {" "}
                {mode === "login" ? "S'inscrire" : "Se connecter"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  brand: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 12 },
  field: { marginTop: 14 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
});
