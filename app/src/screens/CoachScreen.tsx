import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import {
  Sparkles,
  UtensilsCrossed,
  Salad,
  Dumbbell,
  ChefHat,
  Flame,
  Clock,
  History,
  Target,
  ChevronDown,
} from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { burnGoalFromBmr } from "../services/mappers";
import { toast } from "../ui/toast";
import {
  aiService,
  type MealType,
  type Recipe,
  type RecipeSuggestions,
  type Macros,
  type DietPlan,
  type TrainingProgram,
  type Exercise,
  type HistoryItem,
} from "../services/aiService";
import Screen from "../components/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useThemeColors } from "../hooks/useThemeColors";

type Tab = "recipes" | "diet" | "training" | "history";

const tabs: { id: Tab; label: string; Icon: typeof Salad }[] = [
  { id: "recipes", label: "Recettes", Icon: ChefHat },
  { id: "diet", label: "Diète", Icon: Salad },
  { id: "training", label: "Entraînement", Icon: Dumbbell },
  { id: "history", label: "Historique", Icon: History },
];

const mealOptions = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "lunch", label: "Déjeuner" },
  { value: "dinner", label: "Dîner" },
  { value: "snack", label: "Collation" },
];

const workoutOptions = [
  { value: "cardio", label: "Cardio" },
  { value: "strength", label: "Musculation" },
  { value: "hiit", label: "HIIT" },
  { value: "flexibility", label: "Souplesse" },
  { value: "yoga", label: "Yoga" },
];

const dayLabels: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export default function CoachScreen() {
  const { updateCalorieGoals, user } = useAppContext();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("recipes");
  const [loading, setLoading] = useState(false);

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [suggestions, setSuggestions] = useState<RecipeSuggestions | null>(null);
  const [ingredients, setIngredients] = useState("");
  const [generated, setGenerated] = useState<Recipe | null>(null);

  const [macros, setMacros] = useState<Macros | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);

  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [workoutType, setWorkoutType] = useState("hiit");
  const [duration, setDuration] = useState("30");
  const [quickWorkout, setQuickWorkout] = useState<TrainingProgram | null>(null);

  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const run = async (label: string, fn: () => Promise<void>) => {
    setLoading(true);
    toast.info(`${label}…`, "L'IA peut prendre 30 s à 2 min");
    try {
      await fn();
      toast.success("Terminé !");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la requête IA");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = () =>
    run("Recherche de recettes", async () => {
      setSuggestions(await aiService.suggestRecipes(mealType));
    });

  const handleGenerate = () => {
    const list = ingredients.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) {
      toast.error("Entrez au moins un ingrédient (séparés par des virgules)");
      return;
    }
    return run("Génération de recette", async () => {
      setGenerated(await aiService.generateRecipe(list));
    });
  };

  const handleMacros = () =>
    run("Calcul des macros", async () => {
      setMacros(await aiService.getMacros());
    });

  const handleDietPlan = () =>
    run("Génération du plan alimentaire", async () => {
      const { plan, macros: m } = await aiService.getDietPlan();
      setDietPlan(plan);
      setMacros(m);
    });

  const handleProgram = () =>
    run("Génération du programme", async () => {
      setProgram(await aiService.getTrainingProgram());
    });

  const handleQuickWorkout = () =>
    run("Génération de l'entraînement", async () => {
      setQuickWorkout(await aiService.getQuickWorkout(workoutType, Number(duration) || 30));
    });

  const handleApplyMacros = async () => {
    if (!macros) return;
    const intake = macros.calories;
    const burn = macros.bmr ? burnGoalFromBmr(macros.bmr, user?.goal) : undefined;
    try {
      await updateCalorieGoals({ intake, burn });
      toast.success(
        `Objectifs mis à jour : ${Math.round(intake ?? 0)} kcal/j${burn ? ` · ${burn} kcal brûlées` : ""}`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la mise à jour des objectifs");
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      setHistory(await aiService.getHistory());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible de charger l'historique");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "history" && history === null) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
          <Sparkles size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>Coach IA</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Recettes, plans nutritionnels et entraînements
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                styles.tab,
                { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.border },
              ]}
            >
              <t.Icon size={16} color={active ? "#fff" : colors.textMuted} />
              <Text style={{ color: active ? "#fff" : colors.textMuted, fontWeight: "600", fontSize: 13 }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* RECIPES */}
      {tab === "recipes" && (
        <View style={{ gap: 12 }}>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Suggestions selon votre profil
            </Text>
            <Select label="Type de repas" value={mealType} onChange={(v) => setMealType(v as MealType)} options={mealOptions} />
            <Button style={{ marginTop: 14 }} onPress={handleSuggest} disabled={loading}>
              <View style={styles.btnInner}>
                <UtensilsCrossed size={18} color="#fff" />
                <Text style={styles.btnText}>Suggérer 3 recettes</Text>
              </View>
            </Button>
          </Card>

          {suggestions && (
            <View style={{ gap: 12 }}>
              {suggestions.tip ? <Tip text={suggestions.tip} /> : null}
              {suggestions.suggestions?.map((r, i) => <RecipeCard key={i} recipe={r} />)}
            </View>
          )}

          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Générer depuis vos ingrédients
            </Text>
            <Input
              label="Ingrédients (séparés par des virgules)"
              value={ingredients}
              onChangeText={setIngredients}
              placeholder="œufs, épinards, fromage"
            />
            <Button style={{ marginTop: 14 }} onPress={handleGenerate} disabled={loading}>
              <View style={styles.btnInner}>
                <ChefHat size={18} color="#fff" />
                <Text style={styles.btnText}>Créer une recette</Text>
              </View>
            </Button>
          </Card>

          {generated && <RecipeCard recipe={generated} />}
        </View>
      )}

      {/* DIET */}
      {tab === "diet" && (
        <View style={{ gap: 12 }}>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Vos besoins</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={handleMacros} disabled={loading}>
                <View style={styles.btnInner}>
                  <Flame size={18} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "600" }}>Macros</Text>
                </View>
              </Button>
              <Button style={{ flex: 1 }} onPress={handleDietPlan} disabled={loading}>
                <View style={styles.btnInner}>
                  <Salad size={18} color="#fff" />
                  <Text style={styles.btnText}>Plan semaine</Text>
                </View>
              </Button>
            </View>
          </Card>

          {macros && (
            <Card>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Objectifs quotidiens</Text>
              <View style={styles.macroRow}>
                <MacroChip label="Calories" value={macros.calories} unit="kcal" />
                <MacroChip label="Protéines" value={macros.protein_g} unit="g" />
                <MacroChip label="Glucides" value={macros.carbs_g} unit="g" />
                <MacroChip label="Lipides" value={macros.fat_g} unit="g" />
              </View>
              {(macros.bmr || macros.tdee) && (
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
                  BMR : {Math.round(macros.bmr ?? 0)} kcal · TDEE : {Math.round(macros.tdee ?? 0)} kcal
                </Text>
              )}
              <Button style={{ marginTop: 14 }} onPress={handleApplyMacros} disabled={loading}>
                <View style={styles.btnInner}>
                  <Target size={18} color="#fff" />
                  <Text style={styles.btnText}>Appliquer à mes objectifs</Text>
                </View>
              </Button>
            </Card>
          )}

          {dietPlan?.weekly_plan && (
            <Card>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Plan alimentaire hebdomadaire</Text>
              <View style={{ gap: 12 }}>
                {Object.entries(dietPlan.weekly_plan).map(([day, meals]) => (
                  <View key={day} style={[styles.dayBlock, { borderBottomColor: colors.border }]}>
                    <Text style={{ color: colors.primary, fontWeight: "600", marginBottom: 4 }}>
                      {dayLabels[day] ?? day}
                    </Text>
                    {Object.entries(meals).map(([meal, content]) => (
                      <Text key={meal} style={{ color: colors.textMuted, fontSize: 13 }}>
                        <Text style={{ color: colors.textMuted }}>{meal} : </Text>
                        <Text style={{ color: colors.text }}>{content}</Text>
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </Card>
          )}

          {dietPlan?.shopping_list && dietPlan.shopping_list.length > 0 && (
            <Card>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Liste de courses</Text>
              <View style={styles.chips}>
                {dietPlan.shopping_list.map((item, i) => (
                  <Chip key={i} text={item} />
                ))}
              </View>
              {dietPlan.hydration_tip ? <Tip text={dietPlan.hydration_tip} /> : null}
            </Card>
          )}
        </View>
      )}

      {/* TRAINING */}
      {tab === "training" && (
        <View style={{ gap: 12 }}>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Programme personnalisé</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
              Généré selon votre profil et vos activités récentes.
            </Text>
            <Button onPress={handleProgram} disabled={loading}>
              <View style={styles.btnInner}>
                <Dumbbell size={18} color="#fff" />
                <Text style={styles.btnText}>Générer mon programme</Text>
              </View>
            </Button>
          </Card>

          {program && <ProgramView program={program} />}

          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Entraînement express</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Select
                label="Type"
                value={workoutType}
                onChange={setWorkoutType}
                options={workoutOptions}
                style={{ flex: 1 }}
              />
              <Input
                label="Durée (min)"
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                style={{ flex: 1 }}
              />
            </View>
            <Button variant="secondary" style={{ marginTop: 14 }} onPress={handleQuickWorkout} disabled={loading}>
              <View style={styles.btnInner}>
                <Flame size={18} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: "600" }}>Générer un workout rapide</Text>
              </View>
            </Button>
          </Card>

          {quickWorkout && <ProgramView program={quickWorkout} />}
        </View>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>
              Vos dernières recommandations IA.
            </Text>
            <Button variant="secondary" onPress={loadHistory} disabled={historyLoading} style={{ paddingHorizontal: 14 }}>
              <View style={styles.btnInner}>
                <History size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: "600" }}>Rafraîchir</Text>
              </View>
            </Button>
          </View>

          {historyLoading && (
            <Card style={{ alignItems: "center", paddingVertical: 28 }}>
              <ActivityIndicator color={colors.primary} />
            </Card>
          )}

          {!historyLoading && history && history.length === 0 && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <History size={30} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontWeight: "600", marginTop: 10 }}>
                Aucun historique
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 4 }}>
                Générez des recettes, plans ou programmes pour les retrouver ici.
              </Text>
            </Card>
          )}

          {!historyLoading && history?.map((item) => <HistoryCard key={item._id} item={item} />)}
        </View>
      )}

      {loading && (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 12, fontWeight: "500" }}>
            L'IA travaille… (jusqu'à 2 min)
          </Text>
        </View>
      )}
    </Screen>
  );
}

/* ── Composants de présentation ── */

function Tip({ text }: { text: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ backgroundColor: colors.primarySoft, borderRadius: 10, padding: 10 }}>
      <Text style={{ color: colors.primary, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function MacroChip({ label, value, unit }: { label: string; value?: number; unit: string }) {
  const colors = useThemeColors();
  const num = Number(value);
  const display = Number.isFinite(num) ? Math.round(num) : "—";
  return (
    <View style={[macroStyles.chip, { backgroundColor: colors.inputBg }]}>
      <Text style={{ color: colors.primary, fontSize: 17, fontWeight: "700" }}>
        {display}
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "400" }}> {unit}</Text>
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const colors = useThemeColors();
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15, flex: 1 }}>{recipe.name}</Text>
        {recipe.prep_time_min != null && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Clock size={14} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{recipe.prep_time_min} min</Text>
          </View>
        )}
      </View>
      <View style={macroStyles.row}>
        <MacroChip label="kcal" value={recipe.calories} unit="" />
        <MacroChip label="Protéines" value={recipe.protein_g} unit="g" />
        <MacroChip label="Glucides" value={recipe.carbs_g} unit="g" />
        <MacroChip label="Lipides" value={recipe.fat_g} unit="g" />
      </View>
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "500", fontSize: 13, marginBottom: 6 }}>Ingrédients</Text>
          <View style={styles.chips}>
            {recipe.ingredients.map((ing, i) => <Chip key={i} text={ing} />)}
          </View>
        </View>
      )}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "500", fontSize: 13, marginBottom: 6 }}>Préparation</Text>
          {recipe.instructions.map((step, i) => (
            <Text key={i} style={{ color: colors.textMuted, fontSize: 13, marginBottom: 2 }}>
              {i + 1}. {step}
            </Text>
          ))}
        </View>
      )}
      {recipe.benefits ? (
        <View style={{ marginTop: 12 }}>
          <Tip text={recipe.benefits} />
        </View>
      ) : null}
    </Card>
  );
}

function ExerciseLine({ ex }: { ex: Exercise }) {
  const colors = useThemeColors();
  const parts = [
    ex.name,
    ex.sets ? `${ex.sets}×${ex.reps ?? ""}` : ex.reps ? `${ex.reps}` : "",
    ex.duration_min ? `${ex.duration_min} min` : "",
    ex.duration_sec ? `${ex.duration_sec} s` : "",
  ].filter(Boolean);
  return (
    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
      • {parts.join(" — ")}
      {ex.notes ? <Text style={{ fontStyle: "italic" }}> ({ex.notes})</Text> : null}
    </Text>
  );
}

function ProgramView({ program }: { program: TrainingProgram }) {
  const colors = useThemeColors();
  const meta = [
    program.difficulty,
    program.type,
    program.weekly_sessions ? `${program.weekly_sessions} séances/sem.` : null,
    program.duration_min ? `${program.duration_min} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Card>
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
        {program.program_name ?? program.workout_name ?? "Programme"}
      </Text>
      {meta ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{meta}</Text> : null}
      {program.warm_up && program.warm_up.length > 0 && (
        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>
          <Text style={{ fontWeight: "600", color: colors.text }}>Échauffement : </Text>
          {program.warm_up.join(", ")}
        </Text>
      )}
      {program.weekly_plan && (
        <View style={{ marginTop: 8, gap: 12 }}>
          {Object.entries(program.weekly_plan).map(([day, session]) => (
            <View key={day} style={[styles.dayBlock, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>{dayLabels[day] ?? day}</Text>
                {session.duration_min != null && (
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{session.duration_min} min</Text>
                )}
              </View>
              <Text style={{ color: colors.text, fontSize: 13 }}>{session.name ?? session.type}</Text>
              {session.exercises?.map((ex, i) => <ExerciseLine key={i} ex={ex} />)}
            </View>
          ))}
        </View>
      )}
      {program.phases && (
        <View style={{ marginTop: 8, gap: 12 }}>
          {program.phases.map((phase, idx) => (
            <View key={idx} style={[styles.dayBlock, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>{phase.phase}</Text>
                {phase.duration_min != null && (
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{phase.duration_min} min</Text>
                )}
              </View>
              {phase.exercises?.map((ex, i) => <ExerciseLine key={i} ex={ex} />)}
            </View>
          ))}
        </View>
      )}
      {program.coach_tip ? (
        <View style={{ marginTop: 12 }}>
          <Tip text={program.coach_tip} />
        </View>
      ) : null}
    </Card>
  );
}

function NutritionView({ data }: { data: any }) {
  const colors = useThemeColors();
  return (
    <Card>
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15, marginBottom: 4 }}>
        {data.food_name}
      </Text>
      {data.portion_size ? (
        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 10 }}>
          Portion : {data.portion_size}
        </Text>
      ) : null}
      {data.nutrition && (
        <View style={macroStyles.row}>
          <MacroChip label="kcal" value={data.nutrition.calories} unit="" />
          <MacroChip label="Protéines" value={data.nutrition.protein_g} unit="g" />
          <MacroChip label="Glucides" value={data.nutrition.carbs_g} unit="g" />
          <MacroChip label="Lipides" value={data.nutrition.fat_g} unit="g" />
        </View>
      )}
      {Array.isArray(data.ingredients) && data.ingredients.length > 0 && (
        <View style={[styles.chips, { marginTop: 12 }]}>
          {data.ingredients.map((ing: string, i: number) => <Chip key={i} text={ing} />)}
        </View>
      )}
    </Card>
  );
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function PrettyJson({ value, depth = 0 }: { value: any; depth?: number }) {
  const colors = useThemeColors();
  if (value === null || value === undefined)
    return <Text style={{ color: colors.textMuted }}>—</Text>;
  if (typeof value !== "object")
    return <Text style={{ color: colors.text, fontSize: 13 }}>{String(value)}</Text>;
  if (Array.isArray(value))
    return (
      <View style={{ gap: 2 }}>
        {value.map((v, i) => (
          <Text key={i} style={{ color: colors.text, fontSize: 13 }}>
            • {typeof v === "object" ? "" : String(v)}
            {typeof v === "object" ? <PrettyJson value={v} depth={depth + 1} /> : null}
          </Text>
        ))}
      </View>
    );
  return (
    <View style={{ gap: 2, paddingLeft: depth ? 8 : 0 }}>
      {Object.entries(value).map(([k, v]) => (
        <View key={k} style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>
            {cap(k.replace(/_/g, " "))} :{" "}
          </Text>
          <PrettyJson value={v} depth={depth + 1} />
        </View>
      ))}
    </View>
  );
}

// Convertit un repr de dict Python en JSON parsable.
function pyLiteralToJson(input: string): string {
  let out = "";
  let buf = "";
  const flush = () => {
    out += buf
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    buf = "";
  };
  for (let i = 0; i < input.length; ) {
    const ch = input[i];
    if (ch === "'" || ch === '"') {
      flush();
      const quote = ch;
      i++;
      let str = "";
      while (i < input.length) {
        const c = input[i];
        if (c === "\\") {
          const next = input[i + 1];
          if (next === quote) str += quote;
          else if (next === "\\") str += "\\";
          else if (next === "n") str += "\n";
          else if (next === "t") str += "\t";
          else str += next ?? "";
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        str += c;
        i++;
      }
      out += JSON.stringify(str);
    } else {
      buf += ch;
      i++;
    }
  }
  flush();
  return out;
}

function parseContent(content: string): any | null {
  try {
    return JSON.parse(content);
  } catch {
    /* not clean JSON */
  }
  try {
    return JSON.parse(pyLiteralToJson(content));
  } catch {
    return null;
  }
}

function summarizeHistory(data: any): string {
  if (Array.isArray(data?.suggestions))
    return `${data.meal_label ? cap(data.meal_label) : "Recettes"} — ${data.suggestions.length} suggestion${data.suggestions.length > 1 ? "s" : ""}`;
  if (data?.weekly_plan || data?.phases)
    return data.program_name ?? data.workout_name ?? "Programme d'entraînement";
  if (data?.food_name) return data.food_name;
  if (data?.name) return data.name;
  return "Détails de la recommandation";
}

function HistoryContent({ data }: { data: any }) {
  if (Array.isArray(data?.suggestions)) {
    return (
      <View style={{ gap: 12 }}>
        {data.suggestions.map((r: Recipe, i: number) => <RecipeCard key={i} recipe={r} />)}
        {data.tip ? <Tip text={data.tip} /> : null}
      </View>
    );
  }
  if (data?.weekly_plan || data?.phases) return <ProgramView program={data as TrainingProgram} />;
  if (data?.food_name) return <NutritionView data={data} />;
  if (data?.name && (data?.calories != null || data?.ingredients))
    return <RecipeCard recipe={data as Recipe} />;
  return <PrettyJson value={data} />;
}

const historyTypeStyles: Record<string, { label: string; bg: string; fg: string }> = {
  nutrition: { label: "Nutrition", bg: "#d1fae5", fg: "#047857" },
  activity: { label: "Activité", bg: "#dbeafe", fg: "#1d4ed8" },
  general: { label: "Général", bg: "#e2e8f0", fg: "#475569" },
};

function HistoryCard({ item }: { item: HistoryItem }) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const style = historyTypeStyles[item.type] ?? historyTypeStyles.general;
  const date = new Date(item.createdAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const data = useMemo(() => parseContent(item.content), [item.content]);
  const title = data
    ? summarizeHistory(data)
    : item.content.length > 80
      ? item.content.slice(0, 80) + "…"
      : item.content;

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ backgroundColor: style.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: style.fg, fontSize: 11, fontWeight: "600" }}>{style.label}</Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{date}</Text>
      </View>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 4 }}
      >
        <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14, flex: 1 }}>{title}</Text>
        <ChevronDown
          size={16}
          color={colors.textMuted}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {expanded && (
        <View style={{ marginTop: 12 }}>
          {data ? (
            <HistoryContent data={data} />
          ) : (
            <View style={{ backgroundColor: colors.inputBg, borderRadius: 10, padding: 12 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.content}</Text>
            </View>
          )}
        </View>
      )}
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 8 }}>{item.aiModel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  brandIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: { fontWeight: "600", fontSize: 15, marginBottom: 12 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  macroRow: { flexDirection: "row", gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayBlock: { borderBottomWidth: 1, paddingBottom: 10 },
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

const macroStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
});
