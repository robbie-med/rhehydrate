/* PRhehydrate — clinical reference tables (tables.html).
 * Tables are data: each cell is a string (language-neutral) or {en, fr}.
 * Korean comes from js/tables-kr.js (keyed by the English text); RU/ZH fall
 * back to English. Every table cites its source with a link.
 * The "Formulas & code" section prints the live source of js/calc.js and
 * js/sam.js — the exact code the calculator runs. */
(function () {
  "use strict";
  var C = window.RH_CALC, S = C.SRC, SAM = window.RH_SAM;
  var REPO = "https://github.com/robbie-med/rhehydrate/blob/main/";
  var KR = window.RH_TABLES_KR || {};
  var LANGS = ["en", "fr", "kr"], FLAGS = { en: "🇬🇧", fr: "🇫🇷", kr: "🇰🇷" }, HTML_LANG = { en: "en", fr: "fr", kr: "ko" };
  var lang = "en";
  try { var saved = localStorage.getItem("rh.lang"); if (LANGS.indexOf(saved) >= 0) lang = saved; } catch (e) {}

  function L(x) {
    if (x == null) return "";
    if (typeof x === "string") return x;
    if (lang === "kr") return x.kr || KR[x.en] || x.en;
    return x[lang] || x.en;
  }

  var UI = {
    title:  { en: "Clinical Reference Tables", fr: "Tableaux de référence clinique" },
    intro:  { en: "Reference tables for dehydration assessment and rehydration, led by WHO guidance, including severe acute malnutrition (SAM). Every table links to its source. For use alongside the PRhehydrate calculator.",
              fr: "Tableaux de référence pour l'évaluation de la déshydratation et la réhydratation, fondés d'abord sur les recommandations de l'OMS, y compris la malnutrition aiguë sévère (MAS). Chaque tableau renvoie à sa source. À utiliser avec le calculateur PRhehydrate." },
    back:   { en: "Back to calculator", fr: "Retour au calculateur" },
    source: { en: "Source", fr: "Source" },
    sources:{ en: "Sources", fr: "Sources" },
    foot:   { en: "For clinical reference only. Verify all values against current authoritative sources before use. PRhehydrate is not a substitute for clinical judgment.",
              fr: "Pour référence clinique uniquement. Vérifiez toutes les valeurs auprès de sources faisant autorité avant usage. PRhehydrate ne remplace pas le jugement clinique." },
    theme:  { en: ["System", "Light", "Dark"], fr: ["Système", "Clair", "Sombre"], kr: ["시스템", "밝게", "어둡게"] },
    code:   { en: "Source code", fr: "Code source" },
    liveCode: { en: "This is the code running in your browser now, printed from the loaded file.",
                fr: "Voici le code qui s'exécute actuellement dans votre navigateur, affiché depuis le fichier chargé." }
  };

  // ═══════════════════════════════════════════════════════════════════
  var SECTIONS = [

    // ── 1. WHO assessment (lead) ──────────────────────────────────────
    { id: "who-assess",
      title: { en: "WHO: Assessing dehydration", fr: "OMS : Évaluation de la déshydratation" },
      sub:   { en: "Children with diarrhoea — columns A, B, C", fr: "Enfant avec diarrhée — colonnes A, B, C" },
      tables: [{
        cols: [{ t: { en: "Sign", fr: "Signe" }, cls: "col-sign" },
               { t: { en: "A — No dehydration", fr: "A — Pas de déshydratation" }, cls: "th-none" },
               { t: { en: "B — Some dehydration", fr: "B — Signes évidents de déshydratation" }, cls: "th-some" },
               { t: { en: "C — Severe dehydration", fr: "C — Déshydratation sévère" }, cls: "th-severe" }],
        rows: [
          [{ en: "Condition¹", fr: "État général¹" }, { en: "Well, alert", fr: "Bien, éveillé" }, { en: "Restless, irritable", fr: "Agité, irritable" }, { en: "Lethargic or unconscious", fr: "Léthargique ou inconscient" }],
          [{ en: "Eyes²", fr: "Yeux²" }, { en: "Normal", fr: "Normaux" }, { en: "Sunken", fr: "Enfoncés" }, { en: "Sunken", fr: "Enfoncés" }],
          [{ en: "Thirst", fr: "Soif" }, { en: "Drinks normally, not thirsty", fr: "Boit normalement, pas assoiffé" }, { en: "Thirsty, drinks eagerly", fr: "Assoiffé, boit avidement" }, { en: "Drinks poorly or not able to drink", fr: "Boit difficilement ou ne peut pas boire" }],
          [{ en: "Skin pinch³", fr: "Pli cutané³" }, { en: "Goes back quickly", fr: "S'efface rapidement" }, { en: "Goes back slowly", fr: "S'efface lentement" }, { en: "Goes back very slowly (≥ 2 s)", fr: "S'efface très lentement (≥ 2 s)" }],
          [{ en: "Decide", fr: "Décider" }, { en: "Not enough signs for B or C", fr: "Pas assez de signes pour B ou C" }, { en: "Two or more signs in B", fr: "Deux signes ou plus en B" }, { en: "Two or more signs in C", fr: "Deux signes ou plus en C" }],
          [{ en: "Treat", fr: "Traiter" }, { en: "Plan A", fr: "Plan A" }, { en: "Weigh; Plan B", fr: "Peser ; Plan B" }, { en: "Weigh; Plan C urgently", fr: "Peser ; Plan C en urgence" }]
        ]
      }],
      footnotes: [
        { en: "¹ Lethargic is not the same as asleep: the child's mental state is dull and the child cannot be fully awakened.", fr: "¹ Léthargique n'est pas endormi : l'état mental est émoussé et l'enfant ne peut pas être complètement réveillé." },
        { en: "² In some children the eyes are normally somewhat sunken — ask the mother whether they look different than usual.", fr: "² Chez certains enfants, les yeux sont normalement un peu enfoncés — demander à la mère s'ils sont différents de d'habitude." },
        { en: "³ The skin pinch is less useful in marasmus, kwashiorkor or obese children — see the SAM tables below.", fr: "³ Le pli cutané est moins utile en cas de marasme, de kwashiorkor ou d'obésité — voir les tableaux MAS ci-dessous." }
      ],
      sources: [
        { t: "WHO. The treatment of diarrhoea: a manual for physicians and other senior health workers, 4th rev. 2005 — Table 1.", u: S.whoTod },
        { t: "WHO. Pocket book of hospital care for children, 2nd ed. 2013 — Table 12.", u: S.whoPb2013 }
      ] },

    // ── 2. WHO plans ──────────────────────────────────────────────────
    { id: "who-plans",
      title: { en: "WHO: Treatment plans A, B and C", fr: "OMS : Plans de traitement A, B et C" },
      sub:   { en: "Volumes and timing", fr: "Volumes et durées" },
      tables: [{
        cols: [{ t: { en: "Plan", fr: "Plan" } }, { t: { en: "What to give", fr: "Quoi donner" } }],
        rows: [
          [{ en: "A — no dehydration", fr: "A — pas de déshydratation" }, { en: "Extra fluid after each loose stool: < 2 years 50–100 mL; ≥ 2 years 100–200 mL. Zinc 10–14 days: ≤ 6 months 10 mg/day, ≥ 6 months 20 mg/day. Continue feeding.", fr: "Liquides supplémentaires après chaque selle liquide : < 2 ans 50–100 mL ; ≥ 2 ans 100–200 mL. Zinc 10–14 jours : ≤ 6 mois 10 mg/j, ≥ 6 mois 20 mg/j. Poursuivre l'alimentation." }],
          [{ en: "B — some dehydration", fr: "B — signes évidents" }, { en: "ORS 75 mL/kg over 4 h (give more if the child wants more). Reassess at 4 h.", fr: "SRO 75 mL/kg en 4 h (donner plus si l'enfant en veut plus). Réévaluer à 4 h." }],
          [{ en: "C — severe dehydration", fr: "C — déshydratation sévère" }, { en: "IV Ringer's lactate (or normal saline) 100 mL/kg: 30 mL/kg then 70 mL/kg. Infants < 12 months: 1 h + 5 h. Older: 30 min + 2.5 h. Repeat the first portion if the radial pulse is still very weak. ORS ~5 mL/kg/h as soon as the child can drink.", fr: "Ringer lactate IV (ou sérum physiologique) 100 mL/kg : 30 mL/kg puis 70 mL/kg. Nourrisson < 12 mois : 1 h + 5 h. Plus âgé : 30 min + 2,5 h. Répéter la première fraction si le pouls radial reste très faible. SRO ~5 mL/kg/h dès que l'enfant peut boire." }]
        ]
      }, {
        caption: { en: "Plan B — approximate ORS in the first 4 hours (use age only if weight is unknown; otherwise weight × 75)", fr: "Plan B — SRO approximatif pendant les 4 premières heures (âge seulement si le poids est inconnu ; sinon poids × 75)" },
        cols: [{ t: { en: "Age", fr: "Âge" } }, { t: { en: "Weight", fr: "Poids" } }, { t: "mL" }],
        rows: [
          [{ en: "< 4 months", fr: "< 4 mois" }, "< 5 kg", "200–400"],
          [{ en: "4–11 months", fr: "4–11 mois" }, "5–7.9 kg", "400–600"],
          [{ en: "12–23 months", fr: "12–23 mois" }, "8–10.9 kg", "600–800"],
          [{ en: "2–4 years", fr: "2–4 ans" }, "11–15.9 kg", "800–1200"],
          [{ en: "5–14 years", fr: "5–14 ans" }, "16–29.9 kg", "1200–2200"],
          [{ en: "≥ 15 years", fr: "≥ 15 ans" }, "≥ 30 kg", "2200–4000"]
        ]
      }],
      notes: [{ en: "Not for children with severe acute malnutrition — see the SAM protocols below.", fr: "Ne s'applique pas aux enfants avec malnutrition aiguë sévère — voir les protocoles MAS ci-dessous." }],
      sources: [
        { t: "WHO. The treatment of diarrhoea, 2005 — §4.2, Table 2, Table 3.", u: S.whoTod },
        { t: "WHO. Pocket book of hospital care for children, 2013 — §5.2, Table 13, treatment plans A–C.", u: S.whoPb2013 }
      ] },

    // ── 3. Severity by signs (existing table, kept) ───────────────────
    { id: "cdc-signs",
      title: { en: "Severity of dehydration", fr: "Sévérité de la déshydratation" },
      sub:   { en: "Signs & symptoms by category", fr: "Signes et symptômes par catégorie" },
      tables: [{
        cols: [{ t: { en: "Sign / Symptom", fr: "Signe / symptôme" }, cls: "col-sign" },
               { t: { en: "Minimal or No Dehydration", fr: "Déshydratation minime ou absente" }, small: { en: "<3% body weight loss; 3%–5% fluid deficit", fr: "perte de poids < 3 % ; déficit 3–5 %" }, cls: "th-none" },
               { t: { en: "Mild to Moderate Dehydration", fr: "Déshydratation légère à modérée" }, small: { en: "3%–9% body weight loss; 6%–9% fluid deficit", fr: "perte de poids 3–9 % ; déficit 6–9 %" }, cls: "th-some" },
               { t: { en: "Severe Dehydration", fr: "Déshydratation sévère" }, small: { en: ">9% body weight loss; >10% fluid deficit", fr: "perte de poids > 9 % ; déficit > 10 %" }, cls: "th-severe" }],
        rows: [
          [{ en: "Mental status", fr: "État mental" }, { en: "Well; alert", fr: "Bien ; éveillé" }, { en: "Normal, fatigued, or restless, irritable", fr: "Normal, fatigué, ou agité, irritable" }, { en: "Apathetic, lethargic, unconscious", fr: "Apathique, léthargique, inconscient" }],
          [{ en: "Thirst", fr: "Soif" }, { en: "Drinks normally; might refuse liquids", fr: "Boit normalement ; peut refuser les liquides" }, { en: "Thirsty; eager to drink", fr: "Assoiffé ; boit avidement" }, { en: "Drinks poorly; unable to drink", fr: "Boit mal ; ne peut pas boire" }],
          [{ en: "Heart rate", fr: "Fréquence cardiaque" }, { en: "Normal", fr: "Normale" }, { en: "Normal to increased", fr: "Normale à augmentée" }, { en: "Tachycardia, with bradycardia in severe cases", fr: "Tachycardie, bradycardie dans les cas sévères" }],
          [{ en: "Quality of pulses", fr: "Qualité des pouls" }, { en: "Normal", fr: "Normale" }, { en: "Normal to decreased", fr: "Normale à diminuée" }, { en: "Weak, thready, or impalpable", fr: "Faibles, filants ou imperceptibles" }],
          [{ en: "Breathing", fr: "Respiration" }, { en: "Normal", fr: "Normale" }, { en: "Normal; fast", fr: "Normale ; rapide" }, { en: "Deep", fr: "Profonde" }],
          [{ en: "Eyes", fr: "Yeux" }, { en: "Normal", fr: "Normaux" }, { en: "Slightly sunken", fr: "Légèrement enfoncés" }, { en: "Deeply sunken", fr: "Très enfoncés" }],
          [{ en: "Tears", fr: "Larmes" }, { en: "Present", fr: "Présentes" }, { en: "Decreased", fr: "Diminuées" }, { en: "Absent", fr: "Absentes" }],
          [{ en: "Mouth and tongue", fr: "Bouche et langue" }, { en: "Moist", fr: "Humides" }, { en: "Dry", fr: "Sèches" }, { en: "Parched", fr: "Desséchées" }],
          [{ en: "Skin fold", fr: "Pli cutané" }, { en: "Instant recoil", fr: "Retour immédiat" }, { en: "Recoil in <2 s", fr: "Retour en < 2 s" }, { en: "Recoil in >2 s", fr: "Retour en > 2 s" }],
          [{ en: "Capillary refill", fr: "Temps de recoloration" }, { en: "Normal (<3 s)", fr: "Normal (< 3 s)" }, { en: "Prolonged", fr: "Allongé" }, { en: "Prolonged; minimal", fr: "Allongé ; minimal" }],
          [{ en: "Extremities", fr: "Extrémités" }, { en: "Warm", fr: "Chaudes" }, { en: "Cool", fr: "Fraîches" }, { en: "Cold; mottled; cyanotic", fr: "Froides ; marbrées ; cyanosées" }],
          [{ en: "Urine output", fr: "Diurèse" }, { en: "Normal to decreased", fr: "Normale à diminuée" }, { en: "Decreased", fr: "Diminuée" }, { en: "Minimal", fr: "Minimale" }]
        ]
      }],
      notes: [{ en: "US framework (CDC/AAP). WHO settings use the A/B/C table above.", fr: "Cadre américain (CDC/AAP). En contexte OMS, utiliser le tableau A/B/C ci-dessus." }],
      sources: [{ t: "King CK et al. Managing acute gastroenteritis among children. MMWR Recomm Rep 2003;52(RR-16):1–16 (CDC/AAP framework).", u: S.king2003 }] },

    // ── 4. CDS (existing, kept) ───────────────────────────────────────
    { id: "cds",
      title: { en: "Clinical Dehydration Scale (Goldman)", fr: "Échelle clinique de déshydratation (Goldman)" },
      sub:   { en: "Scoring criteria and interpretation", fr: "Critères de score et interprétation" },
      grid: true,
      tables: [{
        cols: [{ t: { en: "Characteristic", fr: "Caractéristique" } }, { t: "0", center: true }, { t: "1", center: true }, { t: "2", center: true }],
        rows: [
          [{ en: "General appearance", fr: "Aspect général" }, { en: "Normal", fr: "Normal" }, { en: "Thirsty, restless, or lethargic but irritable when touched", fr: "Assoiffé, agité, ou léthargique mais irritable au toucher" }, { en: "Drowsy, limp, cold or sweaty ± comatose", fr: "Somnolent, hypotonique, froid ou moite ± comateux" }],
          [{ en: "Eyes", fr: "Yeux" }, { en: "Normal", fr: "Normaux" }, { en: "Slightly sunken", fr: "Légèrement enfoncés" }, { en: "Extremely sunken", fr: "Très enfoncés" }],
          [{ en: "Mucus membrane", fr: "Muqueuses" }, { en: "Moist", fr: "Humides" }, { en: "Sticky", fr: "Collantes" }, { en: "Dry", fr: "Sèches" }],
          [{ en: "Tears", fr: "Larmes" }, { en: "Present", fr: "Présentes" }, { en: "Decreased", fr: "Diminuées" }, { en: "Absent", fr: "Absentes" }]
        ]
      }, {
        cols: [{ t: { en: "Total Score", fr: "Score total" }, center: true }, { t: { en: "Interpretation", fr: "Interprétation" } }],
        rowCls: ["cds-none", "cds-some", "cds-severe"],
        rows: [
          [{ b: "0" }, { en: "No dehydration", fr: "Pas de déshydratation" }],
          [{ b: "1–4" }, { en: "Some dehydration", fr: "Déshydratation légère" }],
          [{ b: "5–8" }, { en: "Moderate to severe dehydration", fr: "Déshydratation modérée à sévère" }]
        ]
      }],
      sources: [{ t: "Goldman RD, Friedman JN, Parkin PC. Validation of the clinical dehydration scale for children with acute gastroenteritis. Pediatrics 2008;122(3):545–549.", u: S.goldman }] },

    // ── 5. SAM criteria ───────────────────────────────────────────────
    { id: "sam-criteria",
      title: { en: "Severe acute malnutrition: who has it?", fr: "Malnutrition aiguë sévère : critères" },
      sub:   { en: "Children 6–59 months", fr: "Enfants de 6 à 59 mois" },
      tables: [{
        cols: [{ t: { en: "Criterion", fr: "Critère" } }, { t: { en: "Severe (SAM)", fr: "Sévère (MAS)" }, cls: "th-severe" }, { t: { en: "Moderate wasting", fr: "Émaciation modérée" }, cls: "th-some" }],
        rows: [
          [{ en: "MUAC", fr: "Périmètre brachial (PB)" }, "< 115 mm", "115 – < 125 mm"],
          [{ en: "Weight-for-height / length z-score", fr: "Poids-pour-taille (z-score)" }, "< −3 SD", "−3 to < −2 SD"],
          [{ en: "Bilateral pitting (nutritional) oedema", fr: "Œdèmes nutritionnels bilatéraux prenant le godet" }, { en: "Any grade (+, ++, +++) = SAM", fr: "Tout degré (+, ++, +++) = MAS" }, "—"],
          [{ en: "Rehydration", fr: "Réhydratation" }, { en: "SAM protocol (ReSoMal preferred; low-osmolarity ORS if unavailable)", fr: "Protocole MAS (ReSoMal de préférence ; SRO faible osmolarité sinon)" }, { en: "Standard WHO plans with low-osmolarity ORS", fr: "Plans OMS standard avec SRO faible osmolarité" }]
        ]
      }],
      notes: [
        { en: "Under 6 months: MUAC is not used for SAM; use weight-for-length < −3 SD or oedema. Admit for inpatient care if any IMCI danger sign, acute medical problem, oedema +++, or failed appetite test.", fr: "Moins de 6 mois : le PB n'est pas utilisé pour la MAS ; utiliser poids-pour-taille < −3 ET ou les œdèmes. Hospitaliser si signe de danger PCIME, problème médical aigu, œdèmes +++ ou échec du test d'appétit." }
      ],
      sources: [
        { t: "WHO. Guideline on the prevention and management of wasting and nutritional oedema, 2023 — definitions; B2, B7, B8.", u: S.who2023 },
        { t: "WHO. Pocket book of hospital care for children, 2013 — §7.1.", u: S.whoPb2013 }
      ] },

    // ── 6. Dehydration in SAM ─────────────────────────────────────────
    { id: "sam-dehyd",
      title: { en: "Dehydration signs in SAM", fr: "Signes de déshydratation en cas de MAS" },
      sub:   { en: "MSF table adapted for SAM — 2 or more signs", fr: "Tableau MSF adapté à la MAS — 2 signes ou plus" },
      tables: [{
        cols: [{ t: { en: "Sign", fr: "Signe" }, cls: "col-sign" },
               { t: { en: "No dehydration", fr: "Pas de déshydratation" }, cls: "th-none" },
               { t: { en: "Some dehydration", fr: "Signes évidents" }, cls: "th-some" },
               { t: { en: "Severe dehydration", fr: "Déshydratation sévère" }, cls: "th-severe" }],
        rows: [
          [{ en: "Mental status", fr: "État de conscience" }, { en: "Normal", fr: "Normal" }, { en: "Restless, irritable", fr: "Agité, irritable" }, { en: "Lethargic or unconscious", fr: "Léthargique ou inconscient" }],
          [{ en: "Thirst", fr: "Soif" }, { en: "No thirst, drinks normally", fr: "Pas de soif, boit normalement" }, { en: "Thirsty, drinks eagerly", fr: "Assoiffé, boit avidement" }, { en: "Unable to drink or drinks poorly", fr: "Ne peut pas boire ou boit mal" }],
          [{ en: "Urine output", fr: "Diurèse" }, { en: "Normal", fr: "Normale" }, { en: "Reduced", fr: "Diminuée" }, { en: "Absent for several hours", fr: "Absente depuis plusieurs heures" }],
          [{ en: "Recent frequent watery diarrhoea and/or vomiting", fr: "Diarrhée aqueuse et/ou vomissements fréquents récents" }, { en: "Yes", fr: "Oui" }, { en: "Yes", fr: "Oui" }, { en: "Yes", fr: "Oui" }],
          [{ en: "Recent obvious rapid weight loss", fr: "Perte de poids rapide et évidente récente" }, { en: "No", fr: "Non" }, { en: "Yes", fr: "Oui" }, { en: "Yes", fr: "Oui" }]
        ]
      }],
      notes: [
        { en: "Sunken eyes and a slow skin pinch are often present in SAM without dehydration; oedema can mask dehydration (WHO 2023 B6; MSF 2024).", fr: "Les yeux enfoncés et un pli cutané lent sont fréquents en cas de MAS sans déshydratation ; les œdèmes peuvent masquer la déshydratation (OMS 2023 B6 ; MSF 2024)." },
        { en: "WHO 2013: dehydration is over-diagnosed in SAM — assume all children with watery diarrhoea or reduced urine output have some dehydration; IV only for shock.", fr: "OMS 2013 : la déshydratation est surdiagnostiquée en cas de MAS — considérer que tout enfant avec diarrhée aqueuse ou diurèse diminuée présente des signes évidents ; IV uniquement en cas de choc." },
        { en: "ACF 2011: diagnose from the history (recent watery diarrhoea, carer reports the eyes recently sank, no full veins, no oedema); children with oedema cannot be 'dehydrated'.", fr: "ACF 2011 : diagnostic par l'anamnèse (diarrhée aqueuse récente, yeux récemment enfoncés selon l'accompagnant, pas de veines pleines, pas d'œdèmes) ; un enfant œdémateux ne peut pas être « déshydraté »." }
      ],
      sources: [
        { t: "Médecins Sans Frontières. Clinical guidelines — Severe acute malnutrition (Feb 2024).", u: S.msfSam },
        { t: "WHO. Guideline on wasting and nutritional oedema, 2023 — B6.", u: S.who2023 },
        { t: "WHO. Pocket book of hospital care for children, 2013 — §7.4.3.", u: S.whoPb2013 },
        { t: "ACF International. Guidelines for the integrated management of SAM, 2011 — pp. 72–78.", u: S.acf2011 }
      ] },

    // ── 7. SAM protocols compared ─────────────────────────────────────
    { id: "sam-protocols",
      title: { en: "SAM rehydration protocols compared", fr: "Protocoles de réhydratation MAS comparés" },
      sub:   { en: "The five protocols selectable in Settings", fr: "Les cinq protocoles sélectionnables dans les Paramètres" },
      tables: [{
        wide: true,
        cols: [{ t: "", cls: "col-sign" }, { t: { en: "WHO 2013/2023 (default)", fr: "OMS 2013/2023 (défaut)" } }, { t: "MSF 2024" }, { t: "ACF 2011" }, { t: { en: "India 2011", fr: "Inde 2011" } }, { t: "Kenya 2022" }],
        rows: [
          [{ en: "Oral fluid", fr: "Soluté oral" }, "ReSoMal", "ReSoMal", "ReSoMal", { en: "Reduced-osmolarity ORS + 15 mL KCl/L", fr: "SRO osmolarité réduite + 15 mL KCl/L" }, "ReSoMal"],
          [{ en: "Some dehydration (oral/NG)", fr: "Signes évidents (oral/NG)" },
           { en: "5 mL/kg every 30 min × 2 h, then 5–10 mL/kg/h for 4–10 h alternating with F-75; max 12 h", fr: "5 mL/kg toutes les 30 min × 2 h, puis 5–10 mL/kg/h pendant 4–10 h en alternance avec F-75 ; max 12 h" },
           { en: "20 mL/kg/h × 2 h, then 10 mL/kg/h to target weight (current × 1.06)", fr: "20 mL/kg/h × 2 h, puis 10 mL/kg/h jusqu'au poids cible (actuel × 1,06)" },
           { en: "10 mL/kg/h × 2 h, then adjust by hourly weight; stop at target (≤ +5%)", fr: "10 mL/kg/h × 2 h, puis ajuster selon la pesée horaire ; arrêt au poids cible (≤ +5 %)" },
           { en: "5 mL/kg every 30 min × 2 h, then 5–10 mL/kg alternate hours up to 10 h", fr: "5 mL/kg toutes les 30 min × 2 h, puis 5–10 mL/kg une heure sur deux jusqu'à 10 h" },
           { en: "10 mL/kg/h × 2 h, then 7.5 mL/kg/h alternating with F-75 for 10 h (5–10)", fr: "10 mL/kg/h × 2 h, puis 7,5 mL/kg/h en alternance avec F-75 pendant 10 h (5–10)" }],
          [{ en: "Severe, no shock", fr: "Sévère, sans choc" },
           { en: "Same oral regimen; IV (Chart 8) only if oral/NG impossible", fr: "Même schéma oral ; IV (tableau 8) seulement si oral/NG impossible" },
           { en: "ReSoMal 20 mL/kg over 1 h (target × 1.1); if vomiting G5%-RL 10 mL/kg/h × 2 h", fr: "ReSoMal 20 mL/kg en 1 h (cible × 1,1) ; si vomissements G5 %-RL 10 mL/kg/h × 2 h" },
           { en: "Same oral regimen", fr: "Même schéma oral" }, { en: "Same oral regimen", fr: "Même schéma oral" }, { en: "Same oral regimen", fr: "Même schéma oral" }],
          [{ en: "Shock: IV", fr: "Choc : IV" },
           { en: "15 mL/kg over 1 h (RL-5% glucose, ½-Darrow's-5% glucose, or 0.45% NaCl-5% glucose); repeat once if improving, then ReSoMal 10 mL/kg/h", fr: "15 mL/kg en 1 h (RL-glucose 5 %, Darrow ½-glucose 5 % ou NaCl 0,45 %-glucose 5 %) ; répéter une fois si amélioration, puis ReSoMal 10 mL/kg/h" },
           { en: "Ceftriaxone 80 mg/kg; G5%-RL 10 mL/kg/h × 2 h; reassess at 1 h and 2 h", fr: "Ceftriaxone 80 mg/kg ; G5 %-RL 10 mL/kg/h × 2 h ; réévaluer à 1 h et 2 h" },
           { en: "15 mL/kg over 1 h (half-strength fluids); repeat while weight is not rising", fr: "15 mL/kg en 1 h (solutés demi-concentrés) ; répéter tant que le poids n'augmente pas" },
           { en: "10% glucose 5 mL/kg; 15 mL/kg over 1 h; repeat once if improving, then ORS 10 mL/kg/h", fr: "Glucose 10 % 5 mL/kg ; 15 mL/kg en 1 h ; répéter une fois si amélioration, puis SRO 10 mL/kg/h" },
           { en: "RL-5% dextrose 20 mL/kg over 2 h", fr: "RL-dextrose 5 % 20 mL/kg en 2 h" }],
          [{ en: "No response", fr: "Pas de réponse" },
           { en: "After 2 boluses: IV 4 mL/kg/h, whole blood 10 mL/kg over 3 h", fr: "Après 2 bolus : IV 4 mL/kg/h, sang total 10 mL/kg en 3 h" },
           { en: "Continue 10 mL/kg/h; check Hb and transfuse", fr: "Poursuivre 10 mL/kg/h ; doser l'Hb et transfuser" },
           { en: "Weight up but no better: toxic/septic/cardiogenic shock — stop", fr: "Poids en hausse sans amélioration : choc toxique/septique/cardiogénique — arrêter" },
           { en: "Septic shock: IV 4 mL/kg/h, review antibiotics, dopamine", fr: "Choc septique : IV 4 mL/kg/h, revoir les antibiotiques, dopamine" },
           { en: "Severe anaemia: transfuse instead of Ringer's", fr: "Anémie sévère : transfuser au lieu du Ringer" }],
          [{ en: "Stop / overload", fr: "Arrêt / surcharge" },
           { en: "Oral: RR +5 and pulse +25. IV: RR +5 and pulse +15, liver ↑, crackles, JVP ↑, gallop", fr: "Oral : FR +5 et pouls +25. IV : FR +5 et pouls +15, foie ↑, crépitants, TVJ ↑, galop" },
           { en: "RR ≥ +10 or HR ≥ +20 plus SpO₂ ↓ > 5%, crackles, gallop, liver ↑ or new oedema", fr: "FR ≥ +10 ou FC ≥ +20 plus SpO₂ ↓ > 5 %, crépitants, galop, foie ↑ ou nouveaux œdèmes" },
           { en: "Target weight, full veins, oedema, liver +1 cm, RR +5, grunting, crackles, gallop", fr: "Poids cible, veines pleines, œdèmes, foie +1 cm, FR +5, geignement, crépitants, galop" },
           { en: "RR +5 and pulse +15, jugular veins engorged, puffy eyelids", fr: "FR +5 et pouls +15, jugulaires turgescentes, paupières gonflées" },
           { en: "—", fr: "—" }],
          [{ en: "Per watery stool", fr: "Par selle liquide" }, "50–100 mL ReSoMal", { en: "5 mL/kg (ORS outpatient; ReSoMal inpatient)", fr: "5 mL/kg (SRO ambulatoire ; ReSoMal hospitalisé)" }, { en: "30 mL (6–24 months only)", fr: "30 mL (6–24 mois seulement)" }, { en: "< 2 y ~50 mL; ≥ 2 y 100 mL ORS", fr: "< 2 ans ~50 mL ; ≥ 2 ans 100 mL SRO" }, { en: "Not specified", fr: "Non précisé" }]
        ]
      }],
      notes: [
        { en: "Cholera or profuse watery diarrhoea: standard ORS, not ReSoMal. MSF (SAM + cholera): some dehydration 75 mL/kg ORS over 4 h; severe/shock RL 20 mL/kg over 30 min (up to 3 boluses) then 70 mL/kg over 6 h — same volume as non-malnourished children, twice as slowly.", fr: "Choléra ou diarrhée aqueuse profuse : SRO standard, pas de ReSoMal. MSF (MAS + choléra) : signes évidents 75 mL/kg de SRO en 4 h ; sévère/choc RL 20 mL/kg en 30 min (jusqu'à 3 bolus) puis 70 mL/kg en 6 h — même volume que chez l'enfant non malnutri, deux fois plus lentement." },
        { en: "Earlier WHO guidance (Treatment of diarrhoea 2005, §8.2) gave 70–100 mL/kg over 12 h, starting at ~10 mL/kg/h; the 2013 Pocket Book regimen above supersedes it.", fr: "Recommandation OMS antérieure (Traitement de la diarrhée 2005, §8.2) : 70–100 mL/kg en 12 h, en commençant à ~10 mL/kg/h ; le schéma du Livre de poche 2013 ci-dessus la remplace." },
        { en: "GASTROSAM (2026): in 415 children with SAM and moderate/severe dehydration, standard WHO ORS gave outcomes similar to ReSoMal, with no fluid overload in either arm.", fr: "GASTROSAM (2026) : chez 415 enfants avec MAS et déshydratation modérée/sévère, le SRO OMS standard a donné des résultats similaires au ReSoMal, sans surcharge hydrique." }
      ],
      sources: [
        { t: "WHO. Pocket book of hospital care for children, 2013 — §7.4.3, Chart 8.", u: S.whoPb2013 },
        { t: "WHO. Guideline on wasting and nutritional oedema, 2023 — B7.", u: S.who2023 },
        { t: "MSF. Clinical guidelines — Severe acute malnutrition (Feb 2024).", u: S.msfSam },
        { t: "ACF International. Guidelines for the integrated management of SAM, 2011 — pp. 72–78.", u: S.acf2011 },
        { t: "MoHFW India. Operational guidelines on facility based management of children with SAM, 2011 — §5.3.", u: S.india2011 },
        { t: "Ministry of Health Kenya. Basic Paediatric Protocols, 5th ed. 2022.", u: S.kenya2022 },
        { t: "MSF. Management of a cholera epidemic — 5.8 Cholera and acute malnutrition.", u: S.msfCholera },
        { t: "WHO. The treatment of diarrhoea, 2005 — §8.2.", u: S.whoTod },
        { t: "GASTROSAM trial. Lancet Child Adolesc Health 2026.", u: S.gastrosam }
      ] },

    // ── 8. ORS comparison (existing, kept) ────────────────────────────
    { id: "ors",
      title: { en: "ORS Comparison", fr: "Comparaison des SRO" },
      sub:   { en: "Composition of common oral rehydration solutions", fr: "Composition des solutions de réhydratation orale courantes" },
      tables: [{
        cols: [{ t: { en: "ORS Product", fr: "Produit" } }, { t: { en: "Carbs (g/L)", fr: "Glucides (g/L)" } }, { t: "Na⁺ (mEq/L)" }, { t: "K⁺ (mEq/L)" }, { t: "Cl⁻ (mEq/L)" }, { t: "HCO₃⁻ (mEq/L)" }, { t: { en: "Osmolarity (mOsm/L)", fr: "Osmolarité (mOsm/L)" } }],
        hl: [0],
        rows: [
          [{ b: { en: "WHO low-osmolarity (2002)", fr: "OMS faible osmolarité (2002)" } }, "13.5", "75", "20", "65", "30ᵃ", "245"],
          ["Pedialyte", "25", "45", "20", "35", "30", "250"],
          ["Ceralyte", "40", "70", "20", "60", "10", "235"],
          ["Enfalyte", "30", "50", "25", "45", "30", "200"],
          ["Rehydra-Lyte", "25", "75", "20", "65", "30", "305"]
        ]
      }],
      footnotes: [{ en: "ᵃ WHO ORS contains trisodium citrate 10 mmol/L (2.9 g/L), which supplies about 30 mEq/L of base.", fr: "ᵃ Le SRO OMS contient du citrate trisodique 10 mmol/L (2,9 g/L), soit environ 30 mEq/L de base." }],
      notes: [
        { en: "WHO low-osmolarity ORS is the formulation in WHO/UNICEF sachets (one sachet per litre of clean water). Check which brands your pharmacy stocks and that they match this composition.", fr: "Le SRO OMS à faible osmolarité est la formule des sachets OMS/UNICEF (un sachet par litre d'eau propre). Vérifiez les marques en stock dans votre pharmacie et leur conformité à cette composition." },
        { en: "The ESPGHAN option (Na⁺ 60 mEq/L, ~200–250 mOsm/L) can be selected under Institution settings.", fr: "L'option ESPGHAN (Na⁺ 60 mEq/L, ~200–250 mOsm/L) peut être choisie dans les paramètres de l'institution." }
      ],
      sources: [
        { t: "WHO. The treatment of diarrhoea, 2005 — Annex 2, Table A (reduced-osmolarity ORS).", u: S.whoTod },
        { t: "Guarino A et al. ESPGHAN/ESPID guidelines for acute gastroenteritis in children in Europe — 2014 update. JPGN 2014;59(1):132–152.", u: S.guarino },
        { t: { en: "Commercial products: manufacturer labels.", fr: "Produits commerciaux : étiquettes des fabricants." }, u: null }
      ] },

    // ── 9. ReSoMal & SAM solutions ────────────────────────────────────
    { id: "resomal",
      title: { en: "ReSoMal and other SAM solutions", fr: "ReSoMal et autres solutés pour la MAS" },
      sub:   { en: "Composition per litre", fr: "Composition par litre" },
      tables: [{
        wide: true,
        cols: [{ t: { en: "Solution", fr: "Soluté" } }, { t: "Na⁺" }, { t: "K⁺" }, { t: "Cl⁻" }, { t: { en: "Citrate", fr: "Citrate" } }, { t: "Mg²⁺" }, { t: "Zn²⁺" }, { t: "Cu²⁺" }, { t: { en: "Sugars", fr: "Sucres" } }, { t: { en: "Osmolarity", fr: "Osmolarité" } }],
        unit: { en: "mmol/L unless stated", fr: "mmol/L sauf indication" },
        rows: [
          [{ b: { en: "ReSoMal, commercial sachet (84 g in 2 L)", fr: "ReSoMal, sachet commercial (84 g dans 2 L)" } }, "45", "40", "70", "7", "3", "0.3", "0.045", { en: "glucose 55, sucrose 73", fr: "glucose 55, saccharose 73" }, "294"],
          [{ en: "ReSoMal, WHO recipe from WHO-ORS (2013)", fr: "ReSoMal, recette OMS à partir du SRO OMS (2013)" }, "~45", "~40", "—", "—", "~3", "—", "—", { en: "+ 50 g sucrose per 2 L", fr: "+ 50 g de saccharose pour 2 L" }, "—"],
          [{ en: "Modified ORS for SAM (WHO 2005)", fr: "SRO modifié pour la MAS (OMS 2005)" }, "37.5", "40", "—", "—", "—", "—", "—", { en: "+ 25 g/L sugar", fr: "+ 25 g/L de sucre" }, "—"],
          [{ en: "India MoHFW: reduced-osmolarity ORS + 15 mL KCl per litre", fr: "Inde MoHFW : SRO osmolarité réduite + 15 mL de KCl par litre" }, "75", { en: "20 + 20", fr: "20 + 20" }, "—", "10", "—", "—", "—", { en: "glucose 75", fr: "glucose 75" }, "—"]
        ]
      }],
      notes: [
        { en: "ReSoMal only under medical supervision in a health facility; not for cholera or for uncomplicated malnutrition (use standard ORS). Commercial ReSoMal and ORS are preferred to solutions prepared in the facility or at home.", fr: "ReSoMal uniquement sous surveillance médicale en structure de santé ; pas en cas de choléra ni de malnutrition non compliquée (utiliser le SRO standard). Le ReSoMal et le SRO commerciaux sont préférables aux solutés préparés sur place ou à domicile." },
        { en: "“—” = not stated in the source.", fr: "« — » = non précisé dans la source." }
      ],
      sources: [
        { t: "MSF. Essential drugs — ReSoMal oral (Nov 2022): composition table.", u: S.msfResomal },
        { t: "WHO. Pocket book of hospital care for children, 2013 — p. 205 (ReSoMal recipe).", u: S.whoPb2013 },
        { t: "WHO. The treatment of diarrhoea, 2005 — §8.2.", u: S.whoTod },
        { t: "MoHFW India. Facility based management of children with SAM, 2011 — §5.3a.", u: S.india2011 },
        { t: "WHO. Guideline on wasting and nutritional oedema, 2023 — B7 remarks.", u: S.who2023 }
      ] },

    // ── 10. Preparation ───────────────────────────────────────────────
    { id: "prep",
      title: { en: "Preparing solutions", fr: "Préparation des solutés" },
      sub:   { en: "Recipes as given in the sources", fr: "Recettes telles que données par les sources" },
      tables: [{
        cols: [{ t: { en: "Solution", fr: "Soluté" } }, { t: { en: "Recipe", fr: "Recette" } }, { t: { en: "Notes", fr: "Remarques" } }],
        rows: [
          [{ en: "Home-made salt–sugar solution", fr: "Solution sucrée-salée maison" },
           { en: "3 g/L table salt (one level teaspoon) + 18 g/L sugar (sucrose)", fr: "3 g/L de sel de table (une cuillère à café rase) + 18 g/L de sucre (saccharose)" },
           { en: "WHO: effective, but not generally recommended — the recipe is often forgotten, ingredients may be unavailable, or too little is given. Prefer ORS; salted home fluids (rice water, soup) are alternatives.", fr: "OMS : efficace mais généralement non recommandée — la recette est souvent oubliée, les ingrédients peuvent manquer, ou la quantité donnée est trop faible. Préférer le SRO ; les liquides salés maison (eau de riz, soupe) sont des alternatives." }],
          [{ en: "ReSoMal from WHO-ORS", fr: "ReSoMal à partir du SRO OMS" },
           { en: "2 L water + one 1-litre packet WHO-ORS + 50 g sucrose + 40 mL electrolyte/mineral solution (or 45 mL of 10% KCl: 100 g KCl in 1 L)", fr: "2 L d'eau + un sachet de SRO OMS pour 1 L + 50 g de saccharose + 40 mL de solution électrolytes/minéraux (ou 45 mL de KCl à 10 % : 100 g de KCl dans 1 L)" },
           { en: "≈ 45 mmol Na, 40 mmol K, 3 mmol Mg per litre (WHO 2013). Not for cholera or profuse watery diarrhoea.", fr: "≈ 45 mmol Na, 40 mmol K, 3 mmol Mg par litre (OMS 2013). Pas en cas de choléra ou de diarrhée aqueuse profuse." }],
          [{ en: "Ringer's lactate with 5% glucose (G5%-RL)", fr: "Ringer lactate avec glucose 5 % (G5 %-RL)" },
           { en: "Remove 50 mL from a 500 mL RL bag; add 50 mL of 50% glucose", fr: "Retirer 50 mL d'une poche de 500 mL de RL ; ajouter 50 mL de glucose 50 %" },
           { en: "MSF 2024; Kenya BPP 2022 (50 mL 50% dextrose + 450 mL RL).", fr: "MSF 2024 ; Kenya BPP 2022 (50 mL de dextrose 50 % + 450 mL de RL)." }],
          [{ en: "RL for cholera infusion (SAM)", fr: "RL pour perfusion choléra (MAS)" },
           { en: "Add 100 mL of 50% glucose to each litre of RL", fr: "Ajouter 100 mL de glucose 50 % par litre de RL" },
           "MSF cholera §5.8."]
        ]
      }],
      sources: [
        { t: "WHO. The treatment of diarrhoea, 2005 — §4.2 (home fluids).", u: S.whoTod },
        { t: "WHO. Pocket book of hospital care for children, 2013 — p. 205.", u: S.whoPb2013 },
        { t: "MSF. Clinical guidelines — Severe acute malnutrition (Feb 2024), footnote d.", u: S.msfSam },
        { t: "Ministry of Health Kenya. Basic Paediatric Protocols, 5th ed. 2022.", u: S.kenya2022 },
        { t: "MSF. 5.8 Cholera and acute malnutrition.", u: S.msfCholera }
      ] },

    // ── 11. Formulas & code ───────────────────────────────────────────
    { id: "formulas", formulas: true,
      title: { en: "Formulas & code", fr: "Formules et code" },
      sub:   { en: "Every calculation the app performs", fr: "Tous les calculs effectués par l'application" } },

    // ── 12. Sports drinks (existing, kept) ────────────────────────────
    { id: "sports",
      title: { en: "Sports Drinks Comparison", fr: "Comparaison des boissons pour sportifs" },
      sub:   { en: "Nutritional composition per serving (US products)", fr: "Composition nutritionnelle par portion (produits américains)" },
      tables: [{
        sticky: true,
        cols: [{ t: { en: "Brand", fr: "Marque" }, cls: "sticky-col" }, { t: { en: "Serving", fr: "Portion" } }, { t: "Cal" }, { t: { en: "Carbs (g)", fr: "Glucides (g)" } }, { t: { en: "% Carb", fr: "% glucides" } }, { t: { en: "Sugars (g)", fr: "Sucres (g)" } }, { t: "Na (mg)" }, { t: "K (mg)" }, { t: { en: "Other Key Ingredients", fr: "Autres ingrédients" } }],
        rows: [
          ["Gatorade Thirst Quencher", "12 fl oz", "80", "22", "6%", "21", "160", "50", { en: "Electrolytes, natural flavor", fr: "Électrolytes, arôme naturel" }],
          ["Powerade", "12 fl oz", "80", "21", "5.9%", "21", "240", "80", { en: "Vitamins C, B12, calcium, magnesium", fr: "Vitamines C, B12, calcium, magnésium" }],
          ["BodyArmor Lyte<sup>a</sup>", "12 fl oz", "15", "11", "4%", "2", "30", "680", { en: "Coconut water, vitamins B3, B5, B6, etc", fr: "Eau de coco, vitamines B3, B5, B6, etc." }],
          ["Propel Water", "12 fl oz", "0", "0", "0%", "0", "160", "40", { en: "Vitamins B6, C, E, niacin, pantothenic acid", fr: "Vitamines B6, C, E, niacine, acide pantothénique" }],
          ["Vitaminwater", "20 fl oz", "100", "26", "6.5%", "26", "0", "60", { en: "Vitamins B, C, E", fr: "Vitamines B, C, E" }],
          ["Nuun Sport<sup>b</sup>", "16 fl oz", "15", "4", "1%", "1", "300", "150", { en: "Magnesium, calcium", fr: "Magnésium, calcium" }],
          ["Powerade Zero", "12 fl oz", "0", "0", "0%", "0", "240", "80", { en: "Vitamins B12, C, calcium, magnesium", fr: "Vitamines B12, C, calcium, magnésium" }],
          ["Pedialyte Classic", "12 fl oz", "25", "7", "3%", "5", "390", "280", { en: "Zinc, chloride 440 mg, zinc 2.8 mg", fr: "Zinc, chlorure 440 mg, zinc 2,8 mg" }],
          ["Skratch Labs Sport<sup>c</sup>", "16 fl oz", "80", "19", "7%", "17", "370", "35", { en: "Vitamin C, calcium, magnesium", fr: "Vitamine C, calcium, magnésium" }],
          ["Ultima Replenisher<sup>d</sup>", "16 fl oz", "0", "0", "0%", "0", "55", "250", { en: "Ca 47 mg, Mg 100 mg, Zn 1 mg, Cl 78 mg, Mn 0.2 mg, vitamin C 100 mg", fr: "Ca 47 mg, Mg 100 mg, Zn 1 mg, Cl 78 mg, Mn 0,2 mg, vitamine C 100 mg" }]
        ]
      }],
      footnotes: [
        { en: "a BodyArmor Lyte — serving size (12 oz) from website; nutrition label did not specify which size.", fr: "a BodyArmor Lyte — portion (12 oz) selon le site ; l'étiquette ne précisait pas la taille." },
        { en: "b Nuun Sport — product supplied as a dissolvable tablet.", fr: "b Nuun Sport — comprimé à dissoudre." },
        { en: "c Skratch Labs Sport Hydration Mix — product supplied as a powder mixture.", fr: "c Skratch Labs Sport Hydration Mix — poudre à mélanger." },
        { en: "d Ultima Replenisher — composition reported per scoop.", fr: "d Ultima Replenisher — composition par mesure." }
      ],
      notes: [{ en: "Sports drinks are not oral rehydration solutions; compare their sodium and sugar with the ORS table above.", fr: "Les boissons pour sportifs ne sont pas des solutions de réhydratation orale ; comparer leur sodium et leur sucre au tableau des SRO ci-dessus." }],
      sources: [{ t: { en: "Manufacturer nutrition labels; data as published.", fr: "Étiquettes nutritionnelles des fabricants ; données telles que publiées." }, u: null }] }
  ];

  // Formulas: description, source, and the function object itself (printed live)
  var FORMULAS = [
    { name: "maintenance(w)", fn: C.maintenance, file: "js/calc.js",
      d: { en: "Holliday–Segar: 100 mL/kg for the first 10 kg + 50 mL/kg for the next 10 kg + 20 mL/kg per kg above 20; hourly = daily ÷ 24.", fr: "Holliday–Segar : 100 mL/kg pour les 10 premiers kg + 50 mL/kg pour les 10 suivants + 20 mL/kg par kg au-delà de 20 ; horaire = quotidien ÷ 24." }, s: S.holliday },
    { name: "deficitVolume(pct, w)", fn: C.deficitVolume, file: "js/calc.js",
      d: { en: "Deficit (mL) = deficit % × weight (kg) × 10 (1% of body weight ≈ 10 mL/kg).", fr: "Déficit (mL) = déficit % × poids (kg) × 10 (1 % du poids ≈ 10 mL/kg)." }, s: S.king2003 },
    { name: "deficitFromWeightLoss(well, cur)", fn: C.deficitFromWeightLoss, file: "js/calc.js",
      d: { en: "% dehydration = (well weight − current weight) ÷ well weight × 100, capped at 15%.", fr: "% de déshydratation = (poids sain − poids actuel) ÷ poids sain × 100, plafonné à 15 %." }, s: S.king2003 },
    { name: "ongoingLosses(stools, emesis, w)", fn: C.ongoingLosses, file: "js/calc.js",
      d: { en: "10 mL/kg per watery stool + 2 mL/kg per emesis.", fr: "10 mL/kg par selle liquide + 2 mL/kg par vomissement." }, s: S.king2003 },
    { name: "cdsSeverity(items)", fn: C.cdsSeverity, file: "js/calc.js",
      d: { en: "Goldman CDS: sum of 4 items (0–2 each); 0 none, 1–4 some, 5–8 moderate/severe.", fr: "ECD de Goldman : somme de 4 items (0–2) ; 0 aucune, 1–4 légère, 5–8 modérée/sévère." }, s: S.goldman },
    { name: "whoSeverity(items)", fn: C.whoSeverity, file: "js/calc.js",
      d: { en: "WHO: ≥ 2 signs in column C = severe; ≥ 2 signs in B or C = some; otherwise none.", fr: "OMS : ≥ 2 signes en C = sévère ; ≥ 2 signes en B ou C = signes évidents ; sinon aucune." }, s: S.whoTod },
    { name: "planB(w, rate, hours)", fn: C.planB, file: "js/calc.js",
      d: { en: "ORS volume = rate (mL/kg, WHO 75) × weight, over the chosen hours.", fr: "Volume de SRO = dose (mL/kg, OMS 75) × poids, sur la durée choisie." }, s: S.whoTod },
    { name: "planCWho(w, months)", fn: C.planCWho, file: "js/calc.js",
      d: { en: "WHO Plan C: 100 mL/kg = 30 mL/kg then 70 mL/kg; < 12 months over 1 h + 5 h, older over 30 min + 2.5 h.", fr: "Plan C OMS : 100 mL/kg = 30 mL/kg puis 70 mL/kg ; < 12 mois en 1 h + 5 h, plus âgé en 30 min + 2,5 h." }, s: S.whoPb2013 },
    { name: "planCBolus(w, deficitVol, maintHr, boluses)", fn: C.planCBolus, file: "js/calc.js",
      d: { en: "Bolus-first: 20 mL/kg boluses; phase 2 = (deficit − boluses given) + 12 h maintenance, over 12 h.", fr: "Bolus d'abord : bolus de 20 mL/kg ; phase 2 = (déficit − bolus administrés) + entretien de 12 h, sur 12 h." }, s: S.whoPb2013 },
    { name: "zinc(months)", fn: C.zinc, file: "js/calc.js",
      d: { en: "Zinc for acute diarrhoea: 10 mg/day under 6 months, 20 mg/day from 6 months, for 10–14 days.", fr: "Zinc pour la diarrhée aiguë : 10 mg/jour avant 6 mois, 20 mg/jour à partir de 6 mois, pendant 10–14 jours.", kr: "급성 설사의 아연: 6개월 미만 10 mg/일, 6개월 이상 20 mg/일, 10–14일." }, s: S.whoTod },
    { name: "samScreen(o)", fn: C.samScreen, file: "js/calc.js",
      d: { en: "SAM if MUAC < 115 mm (6–59 months), weight-for-height < −3 SD, or bilateral pitting oedema.", fr: "MAS si PB < 115 mm (6–59 mois), poids-pour-taille < −3 ET, ou œdèmes bilatéraux prenant le godet." }, s: S.who2023 }
  ];
  SAM.ORDER.forEach(function (id) {
    var p = SAM.PROTOCOLS[id];
    FORMULAS.push({ name: "PROTOCOLS." + id + ".build(ctx)", fn: p.build, file: "js/sam.js",
      d: { en: "SAM protocol: " + p.sources[0].t, fr: "Protocole MAS : " + p.sources[0].t, kr: "SAM 프로토콜: " + p.sources[0].t }, s: p.sources[0].u });
  });

  // ═══════════════════════════════════════════════════════════════════
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function a(href, text) {
    var x = el("a", null, text); x.href = href; x.target = "_blank"; x.rel = "noopener noreferrer"; return x;
  }
  // cell content: plain / {en,fr} / {b: bold}; the few <sup> markers in sports rows are fixed, trusted strings
  function fill(td, c) {
    if (c && typeof c === "object" && "b" in c) { td.appendChild(el("strong", null, L(c.b))); return; }
    var s = L(c);
    if (/<sup>[a-d]<\/sup>$/.test(s)) {
      td.appendChild(document.createTextNode(s.replace(/<sup>.*$/, "")));
      td.appendChild(el("sup", null, s.match(/<sup>(.)<\/sup>/)[1]));
    } else td.textContent = s;
  }

  function renderTable(T) {
    var wrap = el("div", "ref-table-wrap");
    var tb = el("table", "ref-table" + (T.wide ? " ref-wide" : ""));
    if (T.caption || T.unit) tb.appendChild(el("caption", "ref-caption", L(T.caption || T.unit)));
    var thead = el("thead"), tr = el("tr");
    T.cols.forEach(function (c) {
      var th = el("th", c.cls || null); fill(th, c.t);
      if (c.small) { th.appendChild(el("br")); th.appendChild(el("small", null, L(c.small))); }
      if (c.center) th.style.textAlign = "center";
      tr.appendChild(th);
    });
    thead.appendChild(tr); tb.appendChild(thead);
    var tbody = el("tbody");
    T.rows.forEach(function (r, i) {
      var row = el("tr", (T.rowCls && T.rowCls[i]) || ((T.hl || []).indexOf(i) >= 0 ? "ref-row-hl" : null));
      r.forEach(function (c, j) {
        var td = el("td", (T.cols[j] && T.cols[j].cls === "col-sign") ? "col-sign" : ((T.cols[j] && T.cols[j].cls === "sticky-col") ? "sticky-col" : null));
        if (T.cols[j] && T.cols[j].center) td.style.textAlign = "center";
        fill(td, c); row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    tb.appendChild(tbody); wrap.appendChild(tb);
    return wrap;
  }

  function renderSources(list) {
    var p = el("div", "ref-source");
    p.appendChild(el("strong", null, L(list.length > 1 ? UI.sources : UI.source) + ": "));
    var ul = el("ul", "src-list");
    list.forEach(function (s) {
      var li = el("li");
      if (s.u) li.appendChild(a(s.u, L(s.t))); else li.textContent = L(s.t);
      ul.appendChild(li);
    });
    p.appendChild(ul);
    return p;
  }

  function renderFormulas(sec) {
    sec.appendChild(el("p", "ref-source", L(UI.liveCode)));
    FORMULAS.forEach(function (f) {
      var box = el("div", "formula");
      box.appendChild(el("h4", "formula-h", f.name));
      box.appendChild(el("p", "formula-d", L(f.d)));
      var links = el("p", "ref-source");
      if (f.s) { links.appendChild(a(f.s, L(UI.source) + " ↗")); links.appendChild(document.createTextNode(" · ")); }
      links.appendChild(a(REPO + f.file, L(UI.code) + ": " + f.file + " ↗"));
      box.appendChild(links);
      var det = el("details", "working");
      det.appendChild(el("summary", null, f.name));
      var pre = el("pre", "code-block"); pre.appendChild(el("code", null, String(f.fn)));
      det.appendChild(pre);
      box.appendChild(det);
      sec.appendChild(box);
    });
  }

  function render() {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = L(UI.title) + " — PRhehydrate";
    document.getElementById("pageTag").textContent = L(UI.title);
    document.getElementById("backBtn").setAttribute("aria-label", L(UI.back));
    document.getElementById("backBtn").setAttribute("title", L(UI.back));
    document.getElementById("langBtn").textContent = FLAGS[lang];
    var tl = UI.theme[lang] || UI.theme.en;
    Array.prototype.forEach.call(document.querySelectorAll("#themeSeg .seg"), function (b, i) { b.textContent = tl[i]; });
    document.getElementById("footText").textContent = L(UI.foot);

    var root = document.getElementById("tablesRoot"); root.innerHTML = "";
    var intro = el("p", "tables-intro", L(UI.intro));
    root.appendChild(intro);

    var toc = el("ol", "ref-toc");
    SECTIONS.forEach(function (s) {
      var li = el("li"); var x = el("a", null, L(s.title)); x.href = "#" + s.id; li.appendChild(x); toc.appendChild(li);
    });
    root.appendChild(toc);

    SECTIONS.forEach(function (s, i) {
      var sec = el("section", "ref-section"); sec.id = s.id;
      var h = el("div", "ref-section-h");
      h.appendChild(el("span", "ref-num", String(i + 1)));
      h.appendChild(el("span", "ref-label", L(s.title)));
      h.appendChild(el("span", "ref-sub", L(s.sub)));
      sec.appendChild(h);
      if (s.formulas) { renderFormulas(sec); root.appendChild(sec); return; }
      var holder = s.grid ? el("div", "cds-grid") : sec;
      s.tables.forEach(function (T) {
        if (s.grid) { var d = el("div"); d.appendChild(renderTable(T)); holder.appendChild(d); }
        else holder.appendChild(renderTable(T));
      });
      if (s.grid) sec.appendChild(holder);
      if (s.footnotes) {
        var ul = el("ul", "ref-footnotes-plain");
        s.footnotes.forEach(function (f) { ul.appendChild(el("li", null, L(f))); });
        sec.appendChild(ul);
      }
      (s.notes || []).forEach(function (n) { sec.appendChild(el("p", "ref-note", L(n))); });
      if (s.sources) sec.appendChild(renderSources(s.sources));
      root.appendChild(sec);
    });
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }

  document.getElementById("langBtn").addEventListener("click", function () {
    lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
    try { localStorage.setItem("rh.lang", lang); } catch (e) {}
    render();
  });

  render();
})();
