#!/usr/bin/env python3
"""Génère la présentation PowerPoint HealthAI Coach (20 slides)."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ── Charte graphique ────────────────────────────────────────────────────────────
EMERALD = RGBColor(0x10, 0xB9, 0x81)
EMERALD_DARK = RGBColor(0x06, 0x5F, 0x46)
SLATE = RGBColor(0x1E, 0x29, 0x3B)
SLATE_LIGHT = RGBColor(0x47, 0x55, 0x69)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BG = RGBColor(0xF1, 0xF5, 0xF9)
ORANGE = RGBColor(0xF9, 0x73, 0x16)

prs = Presentation()
prs.slide_width = Inches(13.333)   # 16:9
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]

slide_no = 0


def add_slide():
    return prs.slides.add_slide(BLANK)


def box(slide, l, t, w, h):
    return slide.shapes.add_textbox(l, t, w, h).text_frame


def fill_rect(slide, l, t, w, h, color):
    from pptx.enum.shapes import MSO_SHAPE
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    shp.line.fill.background()
    shp.shadow.inherit = False
    return shp


def set_run(run, text, size, color, bold=False, italic=False):
    run.text = text
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic
    run.font.name = "Segoe UI"


def footer(slide, title):
    global slide_no
    slide_no += 1
    fill_rect(slide, 0, SH - Inches(0.28), SW, Inches(0.28), EMERALD)
    tf = box(slide, Inches(0.3), SH - Inches(0.32), Inches(10), Inches(0.3))
    p = tf.paragraphs[0]
    set_run(p.add_run(), f"HealthAI Coach  ·  {title}", 8, WHITE)
    tf2 = box(slide, SW - Inches(1.2), SH - Inches(0.32), Inches(0.9), Inches(0.3))
    p2 = tf2.paragraphs[0]; p2.alignment = PP_ALIGN.RIGHT
    set_run(p2.add_run(), str(slide_no), 8, WHITE, bold=True)


def content_slide(title, subtitle=None):
    """Slide standard : bandeau titre vert + zone de contenu. Retourne la slide."""
    s = add_slide()
    fill_rect(s, 0, 0, SW, Inches(1.15), EMERALD_DARK)
    fill_rect(s, 0, Inches(1.15), SW, Inches(0.06), EMERALD)
    tf = box(s, Inches(0.5), Inches(0.18), SW - Inches(1), Inches(0.95))
    tf.word_wrap = True
    p = tf.paragraphs[0]
    set_run(p.add_run(), title, 26, WHITE, bold=True)
    if subtitle:
        p2 = tf.add_paragraph()
        set_run(p2.add_run(), subtitle, 12, RGBColor(0xD1, 0xFA, 0xE5))
    footer(s, title)
    return s


def bullets(slide, items, left=Inches(0.6), top=Inches(1.5),
            width=None, height=None, size=15, gap=6):
    width = width or (SW - Inches(1.2))
    height = height or (SH - Inches(2.0))
    tf = box(slide, left, top, width, height)
    tf.word_wrap = True
    first = True
    for it in items:
        if isinstance(it, tuple):
            text, level = it
        else:
            text, level = it, 0
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(gap)
        p.level = level
        bullet = "•  " if level == 0 else "–  "
        run = p.add_run()
        is_head = text.endswith(":")
        set_run(run, ("" if level == 0 and is_head else bullet) + text,
                size if level == 0 else size - 1,
                EMERALD_DARK if is_head else SLATE,
                bold=is_head)
    return tf


def table_slide(title, headers, rows, subtitle=None, col_widths=None, fs=11):
    s = content_slide(title, subtitle)
    nrows, ncols = len(rows) + 1, len(headers)
    left, top = Inches(0.6), Inches(1.6)
    width = SW - Inches(1.2)
    height = Inches(0.4) * nrows
    tbl = s.shapes.add_table(nrows, ncols, left, top, width, height).table
    if col_widths:
        for i, cw in enumerate(col_widths):
            tbl.columns[i].width = Inches(cw)
    for j, h in enumerate(headers):
        c = tbl.cell(0, j)
        c.fill.solid(); c.fill.fore_color.rgb = EMERALD_DARK
        tf = c.text_frame; tf.word_wrap = True
        set_run(tf.paragraphs[0].add_run(), h, fs, WHITE, bold=True)
    for i, row in enumerate(rows, 1):
        for j, val in enumerate(row):
            c = tbl.cell(i, j)
            c.fill.solid()
            c.fill.fore_color.rgb = WHITE if i % 2 else LIGHT_BG
            tf = c.text_frame; tf.word_wrap = True
            set_run(tf.paragraphs[0].add_run(), str(val), fs, SLATE)
    return s


# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — COUVERTURE
# ════════════════════════════════════════════════════════════════════════════════
s = add_slide()
fill_rect(s, 0, 0, SW, SH, EMERALD_DARK)
fill_rect(s, 0, Inches(3.05), SW, Inches(0.07), EMERALD)
# logo
from pptx.enum.shapes import MSO_SHAPE
logo = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, SW/2 - Inches(0.6), Inches(1.5), Inches(1.2), Inches(1.2))
logo.fill.solid(); logo.fill.fore_color.rgb = EMERALD; logo.line.fill.background(); logo.shadow.inherit = False
ltf = logo.text_frame; ltf.word_wrap = True
lp = ltf.paragraphs[0]; lp.alignment = PP_ALIGN.CENTER
set_run(lp.add_run(), "H", 44, WHITE, bold=True)
tf = box(s, Inches(1), Inches(3.2), SW - Inches(2), Inches(2))
for i, (txt, sz, col, bold) in enumerate([
    ("HealthAI Coach", 44, WHITE, True),
    ("Suivi santé & nutrition augmenté par l'IA", 20, RGBColor(0xA7,0xF3,0xD0), False),
    ("Présentation du projet — Mission MSPR", 14, RGBColor(0xCB,0xD5,0xE1), False),
]):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.alignment = PP_ALIGN.CENTER
    set_run(p.add_run(), txt, sz, col, bold=bold)
tf2 = box(s, Inches(1), SH - Inches(1.1), SW - Inches(2), Inches(0.6))
p = tf2.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
set_run(p.add_run(), "React · Express · FastAPI · PostgreSQL · MongoDB · Ollama (LLaVA + Llama 3.2)", 12, RGBColor(0x6E,0xE7,0xB7))

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — CONTEXTE & OBJECTIFS
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Contexte & objectifs", "Pourquoi HealthAI Coach ?")
bullets(s, [
    "Le besoin :",
    ("Aider chacun à suivre son alimentation et son activité physique au quotidien", 1),
    ("Fournir des recommandations personnalisées (repas, diète, sport) sans coût ni perte de confidentialité", 1),
    "Les objectifs de la mission :",
    ("Développer une application frontend moderne et responsive", 1),
    ("Concevoir une API IA et un moteur de recommandation connecté à une base NoSQL", 1),
    ("Garantir une solution industrielle : documentée, testée, reproductible", 1),
    "Le parti pris fort :",
    ("Intelligence artificielle exécutée 100 % en local (open source) → souveraineté des données de santé", 1),
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — FONCTIONNALITÉS CLÉS
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Fonctionnalités clés", "Ce que l'utilisateur peut faire")
bullets(s, [
    "Tableau de bord : calories consommées/brûlées, IMC, minutes actives, graphe hebdomadaire",
    "Journal alimentaire : ajout manuel ou rapide + analyse de photo par IA (Photo repas IA)",
    "Journal d'activité : suivi des séances et des calories dépensées",
    "Coach IA : suggestions de recettes, plan diététique hebdomadaire, programmes d'entraînement",
    "Objectifs intelligents : limite calorique et objectif de dépense calculés selon le profil",
    "Historique IA : toutes les recommandations consultables et structurées",
    "Profil : édition, calcul assisté par IA, thème clair/sombre, suppression de compte (RGPD)",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — ARCHITECTURE GLOBALE
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Architecture globale", "3-tiers + microservices IA")
# Schéma simple avec rectangles
def node(slide, l, t, w, h, text, color, txtcolor=WHITE, size=12):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    shp.fill.solid(); shp.fill.fore_color.rgb = color; shp.line.color.rgb = color
    shp.shadow.inherit = False
    tf = shp.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    set_run(p.add_run(), text, size, txtcolor, bold=True)
    return shp

node(s, Inches(0.7), Inches(2.6), Inches(2.6), Inches(1.1), "Frontend\nReact + Vite + Tailwind", EMERALD)
node(s, Inches(4.1), Inches(2.6), Inches(2.9), Inches(1.1), "Backend Express\nAPI REST · JWT · proxy IA", SLATE)
node(s, Inches(7.9), Inches(1.5), Inches(2.6), Inches(0.9), "PostgreSQL\n(données métier)", SLATE_LIGHT, size=11)
node(s, Inches(7.9), Inches(2.7), Inches(2.6), Inches(0.9), "MongoDB (NoSQL)\nrecommandations + logs", SLATE_LIGHT, size=11)
node(s, Inches(7.9), Inches(3.9), Inches(4.4), Inches(0.9), "4 microservices IA FastAPI\nOllama : LLaVA + Llama 3.2", ORANGE, size=11)
tf = box(s, Inches(0.7), Inches(5.1), SW - Inches(1.4), Inches(1.6))
bullets(s, [
    "Le backend orchestre : authentification, validation, quotas, journalisation",
    "L'inférence IA (lente, lourde) est isolée dans des microservices indépendants",
    "Deux bases selon la nature des données : relationnelle vs semi-structurée (NoSQL)",
], top=Inches(5.0), size=13)

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — STACK TECHNIQUE
# ════════════════════════════════════════════════════════════════════════════════
table_slide("Stack technique", ["Couche", "Technologies", "Port"], [
    ["Frontend", "React 19, Vite 8, TypeScript, Tailwind 4, Axios, Recharts", "5173"],
    ["Backend", "Node.js, Express 4, TypeScript, Prisma 5, JWT, Zod, Swagger", "5000"],
    ["Base relationnelle", "PostgreSQL 16 (Docker)", "55432"],
    ["Base NoSQL", "MongoDB 7 (Docker)", "27017"],
    ["Microservices IA", "Python 3.12, FastAPI, Ollama (LLaVA + Llama 3.2)", "8001-8004"],
    ["APIs externes", "Open Food Facts, USDA, TheMealDB, Wger (gratuites)", "—"],
], subtitle="Des technologies à fort écosystème, gratuites et open source",
   col_widths=[2.6, 7.5, 2.0])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE — CONTENEURISATION (DOCKER)
# ════════════════════════════════════════════════════════════════════════════════
def code_box(slide, l, t, w, h, lines, title=None):
    DARK = RGBColor(0x0F, 0x17, 0x2A)
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    shp.fill.solid(); shp.fill.fore_color.rgb = DARK; shp.line.fill.background()
    shp.shadow.inherit = False
    tf = shp.text_frame; tf.word_wrap = True
    tf.margin_left = Inches(0.2); tf.margin_right = Inches(0.15)
    tf.margin_top = Inches(0.15); tf.margin_bottom = Inches(0.1)
    first = True
    if title:
        p = tf.paragraphs[0]; first = False
        set_run(p.add_run(), title, 11, EMERALD, bold=True)
        p.space_after = Pt(6)
    for ln in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(2)
        col = RGBColor(0x6E, 0xE7, 0xB7) if ln.startswith("#") else RGBColor(0xE2, 0xE8, 0xF0)
        r = p.add_run(); r.text = ln
        r.font.size = Pt(10.5); r.font.name = "Consolas"; r.font.color.rgb = col
    return shp

s = content_slide("Conteneurisation & déploiement", "Docker / docker-compose — environnement reproductible")
bullets(s, [
    "Deux stacks docker-compose :",
    ("backend/ : PostgreSQL 16, MongoDB 7, backend Express", 1),
    ("ai_services/ : Ollama + 4 microservices IA (8001-8004)", 1),
    "Volumes persistants : pgdata, mongodata, ollama_data",
    "restart: unless-stopped + healthcheck PostgreSQL",
    "Réseau interne : services joignables par nom (db, mongo, ollama)",
    "Démarrage reproductible en quelques commandes",
], left=Inches(0.6), top=Inches(1.5), width=Inches(6.3), size=14)
code_box(s, Inches(7.1), Inches(1.6), Inches(5.6), Inches(4.7), [
    "# Bases de donnees + backend",
    "cd backend",
    "docker compose up -d",
    "",
    "# IA : Ollama + microservices",
    "cd ai_services",
    "docker compose up -d",
    "",
    "# Telecharger les modeles IA",
    "docker exec healthai-ollama \\",
    "    ollama pull llava",
    "docker exec healthai-ollama \\",
    "    ollama pull llama3.2",
    "",
    "# Verifier l'etat",
    "docker compose ps",
], title="Démarrage en une commande")

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — BENCHMARK FRONTEND
# ════════════════════════════════════════════════════════════════════════════════
table_slide("Benchmark frontend & justification", ["Dimension", "Retenu", "Alternatives", "Pourquoi"], [
    ["Framework", "React 19", "Vue, Angular, Svelte", "Écosystème large, reprise/recrutement faciles, TS mature"],
    ["Build", "Vite 8", "CRA, Webpack, Next.js", "HMR instantané, config minimale, SSR non requis"],
    ["Styling", "Tailwind 4", "MUI, styled-comp.", "Design system cohérent, dark mode, bundle léger"],
], subtitle="Choix orientés maintenabilité, performance et reprise par d'autres équipes",
   col_widths=[1.8, 1.7, 2.6, 6.0], fs=11)

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — PARCOURS UTILISATEUR
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Parcours utilisateur", "De l'inscription au suivi quotidien")
steps = [
    ("1\nConnexion /\nInscription", EMERALD),
    ("2\nOnboarding\n(profil, objectif)", EMERALD_DARK),
    ("3\nTableau de bord", SLATE),
    ("4\nRepas · Activité\n· Coach IA", ORANGE),
]
x = Inches(0.7)
for txt, col in steps:
    node(s, x, Inches(2.8), Inches(2.7), Inches(1.5), txt, col, size=13)
    x += Inches(3.05)
bullets(s, [
    "Onboarding en 3 étapes avec barre de progression (profil, mensurations, objectif)",
    "Objectifs caloriques calculés automatiquement et cohérents avec l'objectif choisi",
    "Application 100 % en français, mobile-first",
], top=Inches(4.8), size=14)

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — JOURNAL ALIMENTAIRE + PHOTO IA
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Module Nutrition", "Journal alimentaire & Photo repas IA")
bullets(s, [
    "Saisie classique :",
    ("Ajout rapide par type de repas, recherche, valeurs caloriques", 1),
    "Photo repas IA (le différenciateur) :",
    ("L'utilisateur prend en photo son assiette → le modèle LLaVA reconnaît l'aliment", 1),
    ("Compression et envoi de l'image en base64, analyse en local", 1),
    ("Enrichissement automatique des calories via Open Food Facts / USDA si besoin", 1),
    ("Pré-remplissage du formulaire avec le nom et les calories détectés", 1),
    "Regroupement des repas par moment de la journée + total calorique du jour",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — COACH IA
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Module Coach IA", "Recommandations personnalisées")
bullets(s, [
    "Recettes : 3 suggestions selon le profil, ou génération à partir d'ingrédients",
    "Diète : calcul des macros (BMR/TDEE) + plan alimentaire hebdomadaire & liste de courses",
    "Entraînement : programme hebdomadaire adapté + séances express (HIIT, cardio, force…)",
    "Application en un clic des objectifs IA (limite calorique & calories à brûler)",
    "Historique : recommandations stockées et affichées de façon structurée (cartes)",
    "Modèles : Llama 3.2 pour le texte, calculs déterministes pour les chiffres clés",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — CHOIX DES ALGORITHMES IA
# ════════════════════════════════════════════════════════════════════════════════
table_slide("Choix des algorithmes IA", ["Capacité", "Modèle / algo", "Justification"], [
    ["Reconnaissance d'image", "LLaVA (vision)", "Open source, local, gratuit, données privées"],
    ["Recettes / diète / sport", "Llama 3.2", "LLM performant en français, sortie JSON"],
    ["Besoins caloriques", "Mifflin-St Jeor", "Formule de référence, exacte et reproductible"],
    ["Enrichissement nutritionnel", "Open Food Facts + USDA", "Bases ouvertes, fiabilisent le chiffre"],
], subtitle="IA générative pour le rédactionnel, calcul déterministe pour les chiffres",
   col_widths=[3.2, 3.0, 5.9])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 11 — CALCUL CALORIQUE DÉTERMINISTE
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Calcul calorique déterministe", "Fiable, vérifiable, instantané")
bullets(s, [
    "BMR (métabolisme de base) — Mifflin-St Jeor :",
    ("10·poids + 6,25·taille − 5·âge + s   (s = +5 homme / −161 femme)", 1),
    "TDEE (dépense totale) :",
    ("BMR × facteur d'activité (1,2 sédentaire → 1,9 très actif)", 1),
    "Calories cibles selon l'objectif :",
    ("− 500 (perte) / 0 (maintien) / + 300 (prise), plancher 1200 kcal", 1),
    "Macronutriments :",
    ("Protéines 1,6–2,0 g/kg · Lipides 0,9 g/kg · Glucides = reste", 1),
    "→ Aucun LLM sur les chiffres : résultat exact et reproductible",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 12 — MOTEUR DE RECOMMANDATION
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Moteur de recommandation", "Microservices séparés + base NoSQL")
bullets(s, [
    "4 microservices FastAPI indépendants de l'application principale :",
    ("api1 (8001) LLaVA · api2 (8002) recettes · api3 (8003) diète · api4 (8004) sport", 1),
    "Persistance NoSQL (MongoDB) — sorties IA hétérogènes sans migration de schéma :",
    ("Collection recommendations : userId, type, contenu JSON, modèle, date", 1),
    ("Collection ailogs : requête, statut, latence, erreurs (observabilité)", 1),
    "Avantages : scalabilité indépendante, tolérance aux pannes, cycles de vie distincts",
    "Backend (Node) et microservices (Python) partagent les mêmes collections",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 13 — MODÈLE DE DONNÉES
# ════════════════════════════════════════════════════════════════════════════════
table_slide("Modèle de données relationnel", ["Table", "Rôle", "Points clés"], [
    ["User", "Profil + identité", "email unique, champs santé optionnels"],
    ["FoodEntry", "Repas", "calories + macros, mealType, index (userId,date)"],
    ["ActivityEntry", "Activités", "durée, caloriesBurned, type"],
    ["GoalSettings", "Objectifs", "relation 1-1, cibles macros & séances"],
    ["HealthMetric", "Mesures corporelles", "poids/IMC/masse grasse historisés"],
    ["RefreshToken", "Sessions JWT", "rotation + révocation au logout"],
], subtitle="PostgreSQL via Prisma · suppression de compte en cascade (RGPD)",
   col_widths=[2.4, 3.2, 6.5])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 14 — API IA & OPENAPI
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("API IA & documentation OpenAPI", "Une surface unique pour les partenaires")
bullets(s, [
    "L'API IA est exposée via le backend (surface /api/ai/*), protégée par JWT",
    "Quota anti-abus : 60 requêtes IA / heure",
    "Spécification OpenAPI 3.0 générée depuis le code (source de vérité unique)",
    "Export reproductible : npm run openapi:export → docs/openapi.json",
    "Swagger UI interactif : /api-docs (« Try it out »)",
    "Chaque microservice expose aussi sa propre doc Swagger (/docs)",
    "Endpoints : analyse d'image, recettes, macros, plan, programme, séance express, historique",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 15 — MÉTRIQUES IA
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Métriques de performance IA", "Mesurables et reproductibles")
bullets(s, [
    "Reconnaissance d'image (classification) :",
    ("Précision, rappel, F1 (macro & micro), exactitude top-1", 1),
    "Estimation calorique :",
    ("MAE (< 80 kcal), MAPE (< 25 %), taux dans ±20 % (> 60 %)", 1),
    "Modèles génératifs (texte) :",
    ("Validité structurelle JSON (100 %), conformité diététique vs TDEE (< 10 %)", 1),
    "Latence journalisée : LLaVA 1-3 min · Llama 30-90 s · calcul macros < 50 ms",
    "Harnais d'évaluation fourni : ai_services/evaluation/ (script + jeu de validation)",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 16 — ERGONOMIE & ACCESSIBILITÉ
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Ergonomie & accessibilité", "Une expérience inclusive")
bullets(s, [
    "Ergonomie (heuristiques de Nielsen, mobile-first) :",
    ("Retours visibles (spinners, toasts, barres de progression), langage métier FR", 1),
    ("Confirmations, validations, prévention des erreurs", 1),
    ("Navigation adaptative : barre basse (mobile) / latérale (desktop)", 1),
    "Accessibilité — cible WCAG 2.1 AA / RGAA 4 :",
    ("En place : contrastes, thème sombre, clavier, focus visible, lang=fr", 1),
    ("Plan : aria-label, association label/champ, régions live, audit axe-core/Lighthouse", 1),
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 17 — TESTS & COUVERTURE
# ════════════════════════════════════════════════════════════════════════════════
table_slide("Tests automatisés & couverture", ["Périmètre", "Outils", "Statut"], [
    ["Backend (services critiques)", "Jest + Supertest", "En place (auth, food, activity)"],
    ["Microservices IA (reco)", "Pytest + mocks (~136 tests)", "En place"],
    ["Frontend (UI)", "Vitest + Testing Library", "Setup fourni, à implémenter"],
], subtitle="Rapports de couverture LCOV/HTML · intégration CI recommandée",
   col_widths=[4.2, 4.6, 3.3])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 18 — SÉCURITÉ, RGPD & ÉTHIQUE
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Sécurité, RGPD & éthique", "La confiance par conception")
bullets(s, [
    "Authentification JWT (access + refresh tokens, rotation, révocation au logout)",
    "Sécurité backend : Helmet, CORS, rate limiting global et spécifique IA, validation Zod",
    "Mots de passe hachés (bcrypt), jamais renvoyés au client",
    "Souveraineté des données : IA exécutée en local, aucune image/profil envoyé à un tiers",
    "RGPD : droit à l'effacement (suppression de compte en cascade)",
    "Transparence : modèle tracé (aiModel) et source des valeurs nutritionnelles indiquée",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 19 — CONDUITE DU CHANGEMENT
# ════════════════════════════════════════════════════════════════════════════════
s = content_slide("Conduite du changement & adoption", "Accompagner tous les profils")
bullets(s, [
    "Personas adressés : grand public, sportif, développeur/partenaire, data scientist, PM",
    "Documentation multi-niveaux : utilisateur, technique, démarrage reproductible",
    "Utilisateur de démo (seed) pour une prise en main immédiate",
    "Déploiement progressif : bêta interne → itération → ouverture",
    "Boucle de feedback via les logs IA (latence, taux d'erreur)",
    "Indicateurs de succès : complétion onboarding, reco/utilisateur, Lighthouse ≥ 90, rétention",
])

# ════════════════════════════════════════════════════════════════════════════════
# SLIDE 20 — CONCLUSION
# ════════════════════════════════════════════════════════════════════════════════
s = add_slide()
fill_rect(s, 0, 0, SW, SH, EMERALD_DARK)
fill_rect(s, 0, Inches(2.0), SW, Inches(0.07), EMERALD)
tf = box(s, Inches(1), Inches(0.8), SW - Inches(2), Inches(1.2))
p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
set_run(p.add_run(), "Conclusion & perspectives", 32, WHITE, bold=True)
tf2 = box(s, Inches(1.3), Inches(2.4), SW - Inches(2.6), Inches(4))
items = [
    "Une application complète, moderne, responsive et 100 % en français",
    "Une IA souveraine (locale, open source) au service de la nutrition et du sport",
    "Une architecture industrielle : microservices, NoSQL, OpenAPI, tests, documentation",
    "Des chiffres fiables (calcul déterministe) et des recommandations personnalisées",
    "",
    "Perspectives : tests UI Vitest, mise en conformité WCAG AA, CI/CD, suivi des métriques en production",
]
first = True
for it in items:
    p = tf2.paragraphs[0] if first else tf2.add_paragraph()
    first = False
    p.space_after = Pt(10)
    if it == "":
        continue
    pre = "✓  " if not it.startswith("Perspectives") else "→  "
    set_run(p.add_run(), pre + it, 16,
            RGBColor(0xA7,0xF3,0xD0) if it.startswith("Perspectives") else WHITE,
            bold=it.startswith("Perspectives"))
tf3 = box(s, Inches(1), SH - Inches(1.0), SW - Inches(2), Inches(0.6))
p = tf3.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
set_run(p.add_run(), "Merci  ·  HealthAI Coach", 14, RGBColor(0x6E,0xE7,0xB7), bold=True)

# ════════════════════════════════════════════════════════════════════════════════
out = "HealthAI_Coach_Presentation.pptx"
prs.save(out)
print(f"PPTX genere : {out} - {len(prs.slides._sldIdLst)} slides")
