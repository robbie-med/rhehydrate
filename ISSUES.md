# Status (v1.8.0, 2026-10-09)

Every finding below is resolved:

- **#1 bolus assumption** — fixed earlier: "boluses given" is an input (1–3) on screen and on the bedside sheet.
- **#2 racecadotril evidence** — fixed earlier: one Cochrane review (2019), little benefit, ESPGHAN option only.
- **#3 capillary refill** — v1.8.0: Table 3 now reads "Normal (≤ 2 s)".
- **#4 HCO₃⁻ column** — v1.8.0: column renamed "Base (mEq/L)" with a footnote that the base is citrate; Ceralyte 70 corrected to 30 mEq/L; "Rehydralyte" spelt as the product.
- **#5 smectite** — v1.8.0: dose age-bracketed (over 2 years), and the ANSM 2019 restriction under 2 years (lead traces) added to the note, education text and references.
- **Default mismatches** — v1.8.0: the settings field now shows the code default (6%, min 1%). Plan C default documented as bolus-first.
- **WHO eyes 1/2 labels** — unchanged by design (IMCI shows "sunken" in both columns).
- **15% cap** — shown in "show the maths" as a separate line.
- **Plan C ongoing losses** — the bedside sheet carries the stool/vomit tally and per-episode volumes for every plan.
- **Sports drinks caution** — note under Table 12.
- **Version drift** — the test suite checks sw.js, app.js and every `?v=` agree.
- **Service worker** — navigations are cached by path; tables.html no longer overwrites index.html.

Also in v1.8.0: a measured or entered deficit below 3% is "none", from 3% "some" (it used to be "none" up to the
institution's "some" percentage, so a 5% measured loss produced Plan A under a 5% deficit).

---

# Medical Accuracy Audit — PRhehydrate v1.3.1

Audit of `robbie-med/rhehydrate` (v1.3.1, commit `2de9990`) covering `js/app.js`,
`js/i18n.js` (all 5 languages), `tables.html`, `index.html`, `sw.js`, and `README.md`.
Scope: clinical accuracy of all computed doses, rates, volumes, schedules, scale
definitions, reference-table values, and translated clinical content.

## Verified correct

The core clinical engine is accurate and consistent with WHO, AAP, Goldman (CDS),
and ESPGHAN sources:

- Holliday–Segar maintenance 100/50/20 mL/kg/day (`app.js:217-221`)
- Deficit estimate 1% body weight ≈ 10 mL/kg (`app.js:235`)
- Ongoing losses: 10 mL/kg per stool, 2 mL/kg per emesis (`app.js:238`)
- CDS items, descriptors, and 0 / 1–4 / 5–8 banding match Goldman 2008;
  "validated 1 mo–5 yr" claim is correct
- WHO Plan B: 75 mL/kg ORS over 4 h; ESPGHAN 50/60 options correctly labeled
- WHO Plan C: 100 mL/kg RL, correct age split (<12 mo: 30 mL/kg in 1 h then 70
  over 5 h; ≥12 mo: 30 in 30 min then 70 over 2.5 h); ORS 5 mL/kg/h once drinking
- Bolus pathway: 20 mL/kg isotonic crystalloid over 15–20 min, repeat to
  ~60 mL/kg, IO after 60–90 s, 10 mL/kg for cardiac disease/severe malnutrition,
  Na correction ≤0.5 mmol/L/h
- Adjuncts: zinc 10–20 mg/d × 10–14 d; ondansetron ≥6 mo (NNT ≈ 5); racecadotril
  1.5 mg/kg TID; *S. boulardii* 250–500 mg/d; WHO low-osmolarity ORS composition
  (Na 75 / K 20 / Cl 65 / citrate 10 / glucose 75, 245 mOsm/L)
- Translations (KR/FR/RU/ZH): every dose, rate, and timing string is numerically
  identical to English; no translation-introduced dosing errors

## Findings

### 1. Phase-2 deficit silently assumes exactly two 20 mL/kg boluses — moderate clinical risk

`js/app.js:373-376` hard-codes `bolusMl = 40 * w`, assuming exactly two boluses
were given before phase 2, while the phase-1 text permits repeating to
~60 mL/kg. If one bolus (20 mL/kg) or three (60 mL/kg) were given, the computed
"remaining deficit" is off by ±20 mL/kg with no warning.

**Fix:** make boluses already given an input, or state the 40 mL/kg assumption
explicitly in the phase-2 output text.

### 2. `edu.s6` overstates racecadotril evidence

`js/i18n.js` (all languages) claims racecadotril is "evidence-supported in 3
Cochrane reviews." There is essentially one Cochrane review of racecadotril for
pediatric acute diarrhea, and it rated the evidence limited/low-quality.
ESPGHAN's recommendation is weak ("may be considered").

**Fix:** soften to "one Cochrane review; ESPGHAN weak recommendation."

### 3. Capillary refill threshold in Table 1

`tables.html:125` lists normal capillary refill as "<3 s". The pediatric norm is
≤2 s; 3 s could falsely reassure. The source CDC table says only "Normal," so
the added threshold should be <2 s.

### 4. Table 3 "HCO₃⁻" column mislabels citrate

`tables.html:251` — WHO ORS and Pedialyte contain no bicarbonate; the "30" is
citrate base-equivalents (10 mmol/L trivalent citrate = 30 mEq/L base). Classic
comparison tables label this column "base."

**Fix:** rename the column to "Base (citrate)" or equivalent.

### 5. Smectite dose lacks age bracketing

`js/i18n.js` `plan.b.smectite` gives a flat "3 g per dose up to 3× daily" for
all children; product labeling is age-stratified (e.g., <1 yr: 3 g/day; 1–2 yr:
3–6 g/day; >2 yr: 6–9 g/day). Low acute risk (not systemically absorbed), but
should be age-qualified. Also, the strongest recent evidence — the Florez 2020
IPDMA the app itself cites (ref 8) — found a more modest effect than the
"~24 h shorter" claim.

## Minor / documentation issues

- **Default mismatches:** code default `somePct: 6` vs README/HTML claim of 7.5
  (`app.js:33`, `index.html:268`); code default Plan C approach is `"bolus"` vs
  README's "WHO" (`app.js:32`). Fresh installs behave differently than documented.
- **WHO-method eyes item** has identical labels for score 1 and 2 ("Sunken"/
  "Sunken", all languages) — faithful to IMCI (sunken eyes appears in both
  columns) but the radio options are indistinguishable. Cosmetic; near-zero
  classification impact.
- **Weight-loss method clamps the deficit at 15%** (`app.js:202`) without
  telling the user; still classifies severe, so impact is limited to an
  understated deficit volume.
- **Plan C never mentions ongoing-loss replacement** — `lossVol` appears in
  Plan B text but not in either Plan C variant.
- **Table 4 (sports drinks)** has no explicit "not suitable as ORS in children"
  caution — worth one line given the Na 75 mEq/L (WHO ORS) vs ~20 mEq/L
  (Gatorade) contrast the table itself shows.
- **Version drift:** README badge says 1.3.0; `APP_VERSION` is 1.3.1.
- **Service worker (functional, non-medical):** `sw.js:44` caches *every*
  navigation as `./index.html`, so visiting `tables.html` online overwrites the
  offline copy of the calculator itself.

## Bottom line

No dangerous errors — every computed dose, rate, volume, and schedule the app
outputs is correct per WHO/AAP/ESPGHAN, and the multilingual content is
consistent. The one finding with real bedside consequence is **#1** (the hidden
40 mL/kg assumption in bolus-first phase-2 math); the rest are
accuracy-of-framing and labeling issues. Disclaimers, red-flag list, and
"decision support only" framing are appropriate throughout.
