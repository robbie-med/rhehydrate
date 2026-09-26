# SAM rehydration protocols — source record

This file records where every number in `js/sam.js` comes from, so a clinician can
check the app against the primary documents without reading code. Quotations are
short extracts from the cited pages. Checked September 2026.

**Scope.** Children 6–59 months with severe acute malnutrition (SAM) and diarrhoea
with or without dehydration. The app uses these protocols only when the
malnutrition screen is positive.

**Default.** WHO is pre-selected: WHO guidance is the global reference that
national protocols adapt (the India and Kenya protocols below are examples). The
other four can be chosen under *Settings → Malnutrition (SAM)*.

---

## SAM definition (all protocols)

| Source | Criteria |
|---|---|
| [WHO 2023 wasting guideline](https://iris.who.int/handle/10665/376075), §1.2 | "nutritional oedema and/or WHZ or WLZ < -3 and/or MUAC < 115mm" (6–59 months) |
| [WHO Pocket Book 2013](https://www.who.int/publications/i/item/978-92-4-154837-3), §7.1 | "oedema of both feet or severe wasting (weight-for-height/length <-3SD or mid-upper arm circumference < 115 mm)" |
| [MSF 2024](https://medicalguidelines.msf.org/en/viewport/CG/english/severe-acute-malnutrition-16689141.html) | MUAC < 115 mm; WHZ < –3; bilateral pitting oedema "regardless of MUAC and WHZ" |

Moderate wasting (MUAC 115 – < 125 mm, WHZ −3 to −2): WHO 2023 **B8** — use
low-osmolarity ORS "in accordance with existing WHO recommendations", i.e. the
standard plans. The app shows this note and keeps Plans A/B/C.

Code: `samScreen()` in `js/calc.js`.

---

## 1. WHO — Pocket Book 2013 (+ WHO 2023)

Sources: [Pocket book of hospital care for children, 2nd ed., 2013](https://www.who.int/publications/i/item/978-92-4-154837-3)
§7.4.1 (p. 201–202), §7.4.3 (pp. 203–206), Chart 8 (p. 14);
[WHO 2023 guideline](https://iris.who.int/handle/10665/376075) recs B6–B8.

**Diagnosis (p. 203–204).** "Dehydration tends to be overdiagnosed and its severity
overestimated … Assume that all children with watery diarrhoea or reduced urine
output have some dehydration … poor circulatory volume or perfusion can co-exist
with oedema."

**Fluid.** ReSoMal. WHO 2023 B7: "the preferred rehydration fluid is … ReSoMal. If
not available, low-osmolarity ORS can be used." (setting: *Oral fluid for SAM*.)

**Oral / NG (p. 204).**
- "Give 5 ml/kg every 30 min for the first 2 h." → `5 × weight` per dose, 4 doses.
- "Then give 5–10 ml/kg per h for the next 4–10 h on alternate hours, with F-75."
- "5–10ml/kg per h up to a maximum of 12 hours."
- "If rehydration is still required at 10 h, give starter F-75 … instead of ReSoMal."
- Overhydration (p. 206): "respiratory rate increasing by 5/min and pulse rate by
  25/min" → stop ReSoMal, reassess after 1 h.
- Prevention (p. 206): "50–100 ml after each watery stool."

**Shock — Chart 8 (p. 14).** "Give IV fluid at 15 ml/kg over 1 h" — RL with 5%
glucose, half-strength Darrow's with 5% glucose, or 0.45% NaCl with 5% glucose.
If improving, "repeat IV infusion at 15 ml/kg over 1 h; then … ReSoMal at 10 ml/kg
per h up to 10 h". "If the child fails to improve after two IV boluses of 15 ml/kg
– give maintenance IV fluid (4 ml/kg per h) … transfuse fresh whole blood at 10
ml/kg slowly over 3 h". Stop if "breathing rate increases by 5/min and pulse rate
increases by 15/min …".
Hypoglycaemia (§7.4.1): "If the child is unconscious, treat with IV 10% glucose at
5 ml/kg"; hypoglycaemia is "< 3 mmol/litre".

Severe dehydration without shock but unable to take oral/NG fluids: IV per Chart 8
(p. 204: "If in shock or severe dehydration but cannot be rehydrated orally or by
nasogastric tube, give IV fluids …").

> Note: the 2005 first edition differs (overhydration threshold pulse +15; septic
> shock after the *first* bolus; ReSoMal ≈ 37.5 mmol Na/L). The app follows 2013.

## 2. MSF — Clinical guidelines, Severe acute malnutrition (updated Feb 2024)

Source: [medicalguidelines.msf.org — SAM](https://medicalguidelines.msf.org/en/viewport/CG/english/severe-acute-malnutrition-16689141.html);
[ReSoMal monograph (Nov 2022)](https://medicalguidelines.msf.org/en/viewport/EssDr/english/resomal-rehydration-solution-for-malnutrition-oral-16684569.html).

- **Plan A SAM:** outpatient "ORS PO: 5 ml/kg after each loose stool"; inpatient
  with frequent/abundant stools, ReSoMal 5 ml/kg after each loose stool.
- **Plan B SAM:** target weight = pre-diarrhoea weight, else "current weight x
  1.06". "ReSoMal PO or by NGT: 20 ml/kg/hour for 2 hours" + 5 ml/kg per loose
  stool; if improving "Reduce ReSoMal to 10 ml/kg/hour"; no improvement after 2–4 h
  → Plan C with circulatory impairment.
- **Plan C SAM:** target "current weight x 1.1". No circulatory impairment:
  "ReSoMal PO or by NGT: 20 ml/kg over 1 hour"; not tolerated → "G5%-RL IV
  infusion: 10 ml/kg/hour for 2 hours".
- **Circulatory impairment:** "ceftriaxone IV, one dose of 80 mg/kg"; "G5%-RL IV
  infusion: 10 ml/kg/hour for 2 hours"; reassess at 1 h and 2 h; transfuse if no
  improvement.
- **G5%-RL:** "Remove 50 ml of Ringer lactate … add 50 ml of 50% glucose".
- **Fluid overload:** RR ≥ +10 or HR ≥ +20 plus one of: SpO₂ drop > 5%, rales,
  gallop, increased liver size, new oedema.

## 3. ACF International (2011) — weight-guided

Source: [ACF-IN Guidelines for the integrated management of SAM, Dec 2011](https://www.actionagainsthunger.org/app/uploads/2022/09/Guidelines_For_the_integrated_management_of_severe_acute_malnutrition_In_and_out_patient_treatment_12.2011.pdf), pp. 72–78.

- Do not use skin pinch or sunken eyes; diagnose from history (watery diarrhoea,
  carer reports recent change in eyes, no full veins, **no oedema**).
- "Start with 10ml/kg/h for the first two hours orally or by naso-gastric tube".
- At 2 h: continued weight loss → "Increase … by 10ml/kg/hour"; no weight gain →
  "by 5ml/kg/hour".
- Target: pre-diarrhoea weight; newly admitted, "Do not attempt to increase body
  weight by more than 5% in conscious children" → app upper limit `weight × 1.05`.
- Typical total "a total of 50ml per kg body weight - 5% body weight".
- After rehydration: "for malnourished children from 6 to 24 months, 30ml of
  ReSoMal can be given for each watery stool"; "The standard instructions to give
  50-100ml for each stool should not be applied".
- Shock (definite dehydration + semi/unconscious + rapid weak pulse + cold
  extremities + poor capillary refill): "Give 15 ml/kg IV over the first hour";
  repeat while weight is falling or stable; half-strength fluids.
- Oedema: "Oedematous patients cannot be 'dehydrated'"; if deteriorating with
  watery diarrhoea, "30ml of ReSoMal per watery stool". The app shows only this
  note for ACF when oedema is present.

## 4. India — MoHFW facility-based SAM (2011)

Source: [Operational guidelines on facility based management of children with SAM](https://nhm.assam.gov.in/sites/default/files/swf_utility_folder/departments/nhm_lipl_in_oid_6/do_u_want_2_know/Operational%20Guidelines%20on%20Facility%20Based%20Management%20of%20Children%20with%20Severe%20Acute%20Malnutrition.pdf), §5.3a–5.3b (pp. 42–45).

- Fluid: "Reduced osmolarity ORS is used; add 15 ml of potassium chloride to one
  litre ORS (15 ml contains 20 mmol/L of potassium)".
- 5 ml/kg every 30 minutes for first 2 hours; 5–10 ml/kg in alternate hours for up
  to 10 hours.
- Overhydration: pulse +15 and RR +5 (both), jugular veins engorged, puffy eyes.
- Ongoing losses: "less than 2 years … approximately 50 ml"; "2 years and older …
  100 ml".
- Shock: lethargic/unconscious and cold hands plus slow capillary refill (> 3 s) or
  weak/fast pulse. 10% glucose 5 ml/kg; "IV fluid 15 ml/kg over 1 hour"; if
  improving repeat, then ORS 10 ml/kg/hr up to 10 hours; if not, septic shock —
  maintenance IV 4 ml/kg/hr, review antibiotics, start dopamine.

## 5. Kenya — Basic Paediatric Protocols, 5th ed. (Feb 2022)

Source: [Kijabe Hospital copy](https://kijabehospital.or.ke/uploads/guidelines/1712736965_Basic_Paediatric_Protocols-JAN_27_2022_DRAFT_SW.pdf)
(text verified; unchanged from the 2016 edition);
[official print edition](https://paediatrics.uonbi.ac.ke/sites/paediatrics.uonbi.ac.ke/files/2023-04/Basic%20Paediatric%20protocol%205th%20edition%20FOR%20PRINT%2031st%20Oct%202022.pdf).

- Shock (AVPU < A, weak/absent pulse, CRT > 3 s, cold periphery): "Give 20 mls/kg
  in 2 hrs of Ringer's lactate with 5% dextrose (… add 50 mls 50% dextrose to 450
  mls Ringer's Lactate)". Severe anaemia → transfuse instead.
- Unable to take oral/NG: IV maintenance 4 mls/kg/hr.
- "For 2 hours: Give ReSoMal at 10mls/kg/hour", then 7.5 ml/kg over 1 hour, then
  alternate ReSoMal with F-75 at 7.5 mls/kg/hr for 10 hours (5–10 as tolerated); at
  12 hours switch to 3-hourly F-75.
- Transfuse if Hb < 4 g/dL: 10 mls/kg whole blood in 3 hrs + furosemide 1 mg/kg.
- No per-stool replacement volume in the SAM fluid chart (the app says so).

---

## Cholera or profuse watery diarrhoea (overrides the selected protocol)

Source: [MSF — 5.8 Cholera and acute malnutrition](https://medicalguidelines.msf.org/en/viewport/CHOL/english/5-8-cholera-and-acute-malnutrition-32409733.html).
WHO (Pocket Book 2013 p. 204; 2013 SAM update) and the MSF ReSoMal monograph
also advise against ReSoMal in cholera.

- Some dehydration: "75 ml/kg over 4 hours. Use standard ORS. Do not use ReSoMal".
- Severe / shock: "20 ml/kg of RL over 30 minutes" (repeat up to 2 times), then
  "70 ml/kg of RL over 6 hours", adding "100 ml of 50% glucose to each litre of
  RL". "Same volume of RL as non-malnourished children … twice as slow."

## Evidence note shown with every SAM plan

GASTROSAM — [Lancet Child Adolesc Health 2026, doi:10.1016/S2352-4642(25)00371-2](https://doi.org/10.1016/S2352-4642(25)00371-2):
415 children with SAM and moderate/severe dehydration (Kenya, Niger, Nigeria,
Uganda); WHO-ORS gave outcomes similar to ReSoMal, with no fluid overload in either
arm. None of the five protocols had been updated in response when this version was
written.

## Composition data (tables page)

- ReSoMal (MSF monograph): glucose 55, sucrose 73, Na 45, K 40, Cl 70, citrate 7,
  Mg 3, Zn 0.3, Cu 0.045 mmol/L; osmolarity 294.
- ReSoMal from WHO-ORS (Pocket Book 2013 p. 205): 2 L water + one 1-L packet WHO-ORS
  + 50 g sucrose + 40 ml electrolyte/mineral solution (or 45 ml 10% KCl); "approximately
  45 mmol sodium, 40 mmol potassium and 3 mmol magnesium per litre".
- Home-made salt–sugar solution ([WHO Treatment of diarrhoea 2005](https://www.who.int/publications/i/item/9241593180), §4.2):
  "3g/l of table salt (one level teaspoonful) and 18g/l of common sugar (sucrose) is
  effective but is not generally recommended".

## Before clinical use

Have a paediatrician at the deploying institution check this file and the app's
output against the protocol they follow. National protocols (for example PCIMA in
francophone West Africa) may differ from all five.
