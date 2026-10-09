<div align="center">

# PRhehydrate

**Evidence-based pediatric dehydration severity & rehydration protocol calculator**

[![Live](https://img.shields.io/badge/live-prhehydrate.robbiemed.org-c89a3c?style=flat-square&logo=github-pages&logoColor=white)](https://prhehydrate.robbiemed.org)
[![PWA](https://img.shields.io/badge/PWA-offline--first-4ec87a?style=flat-square&logo=pwa&logoColor=white)](https://prhehydrate.robbiemed.org)
[![Languages](https://img.shields.io/badge/languages-EN·KR·FR·RU·ZH-9e9488?style=flat-square)](#languages)
[![License](https://img.shields.io/badge/license-MIT-555?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.12.0-888?style=flat-square)](#)

A fast, offline-capable, clinician-facing decision-support tool for the bedside assessment
and management of pediatric dehydration. No login. No telemetry. No build step.
Runs entirely in the browser.

**[→ prhehydrate.robbiemed.org](https://prhehydrate.robbiemed.org)**

</div>

---

## What it does

Enter the child's weight, choose a severity assessment method, and PRhehydrate instantly
produces a structured, fully calculated rehydration plan — volumes, rates, timing, and
adjunct reminders — matched to local institution parameters.

### Severity assessment

Four methods, selectable at the bedside:

| Method | Basis |
|--------|-------|
| **Clinical Dehydration Scale (CDS)** | Goldman 4-item scale, 0–8 pts · validated 1 mo–5 yr |
| **WHO / IMCI clinical signs** | Two-or-more signs per column → severity class |
| **Measured weight loss** | `% deficit = (well weight − current) ÷ well weight × 100` (capped at 15%) |
| **Direct % entry** | Clinician override for experienced estimation |

A measured or entered deficit is banded as **none** below 3% (CDC/AAP minimal dehydration), **some** up to
the institution's "severe" threshold (default 10%), and **severe** from there. The clinical scales assign the
institution's "some" and "severe" deficit percentages instead.

### Severe acute malnutrition (SAM)

A malnutrition screen (MUAC, weight-for-height, bilateral oedema — WHO 2023 criteria)
sits above the severity assessment. When it is positive, Plans A/B/C are replaced by a
SAM rehydration plan from the protocol chosen in Settings:

| Protocol | Source |
|----------|--------|
| **WHO** (default) | Pocket Book of Hospital Care for Children 2013 + WHO wasting guideline 2023 |
| **MSF** | Clinical guidelines — Severe acute malnutrition (Feb 2024) |
| **ACF International** | Guidelines for the integrated management of SAM (2011) — weight-guided |
| **India** | MoHFW facility-based management of children with SAM (2011) |
| **Kenya** | Basic Paediatric Protocols, 5th ed. (2022) |

Inputs for shock, oral/NG tolerance, suspected cholera and pre-illness weight steer the
plan; suspected cholera switches to MSF's SAM-specific cholera volumes with standard ORS.
Every plan lists its sources. Page-level excerpts for each number:
[`docs/SAM-PROTOCOLS.md`](./docs/SAM-PROTOCOLS.md). The screen can be optional
(default), required before any plan, or off.

### Outputs

- **Severity banner** — none / some (mild–moderate) / severe
- **Fluid deficit** — % and mL (`1% body weight ≈ 10 mL/kg`)
- **Maintenance** — Holliday–Segar 100/50/20 mL/kg/day (4-2-1 rule), daily and hourly
- **Ongoing-loss replacement** — 10 mL/kg per watery stool, 2 mL/kg per emesis episode
- **Rehydration protocol** — WHO Plan A / B / C with all volumes and timing pre-filled;
  AAP isotonic-bolus alternative available for severe disease
- **Adjunct reminders** — zinc, ondansetron, NG-ORS, racecadotril, smectite, *S. boulardii*
  (each individually toggleable per institution)
- **Red-flag checklist** — shock, altered consciousness, surgical abdomen, dysnatraemia
- **Show the maths** — under every result: the formula, this patient's numbers
  substituted, the result, a link to the source, and a link to the code
- **Bedside sheet** — the plan printed as a checklist to hang on the bed (A4 or Letter,
  black and white): a timed row for each step with boxes for the time given, the amount
  actually given and the nurse's initials; reassessment rows; stop signs; a stool / vomit
  tally with the replacement volume; zinc with the dose for the child's age and a box for
  each day; and a "plan changed" line. The child's name is written by hand on the paper —
  it is never entered in the app. The on-screen preview can be copied by hand where there
  is no printer.
- **Print / save** — formatted output for the medical record

> **⚕ Decision support only.** PRhehydrate is not a regulated medical device. Verify every
> dose and volume against your local protocol and direct clinical assessment.

---

## Features

<table>
<tr>
  <td><strong>📴 Offline-first PWA</strong></td>
  <td>Service worker caches all assets on first visit. Works with airplane mode, poor Wi-Fi, or no internet at all. Installable to the home screen on iOS and Android.</td>
</tr>
<tr>
  <td><strong>🌐 Five languages</strong></td>
  <td>🇬🇧 English · 🇰🇷 한국어 · 🇫🇷 Français · 🇷🇺 Русский · 🇨🇳 中文. Every language covers everything: the SAM pathway, show-the-maths working, the bedside sheet and the reference tables. The browser language is detected on first visit.</td>
</tr>
<tr>
  <td><strong>🔗 Setup link</strong></td>
  <td>Settings → Setup link creates a URL carrying the language, assessment method and all institution settings. Opening it on another device applies and saves them — one link sets up a whole ward.</td>
</tr>
<tr>
  <td><strong>∑ Transparent maths</strong></td>
  <td>All formulas live in <code>js/calc.js</code> and <code>js/sam.js</code> as pure functions that return their working. The reference-tables page prints the live source of each one; <code>node tests/calc.test.js</code> checks them.</td>
</tr>
<tr>
  <td><strong>🏥 Institution parameters</strong></td>
  <td>Configurable IV fluid choice, ORS dose, rehydration duration, Plan C approach, deficit thresholds, and adjunct note visibility. All settings saved locally — no account needed.</td>
</tr>
<tr>
  <td><strong>🌗 Thoughtful theming</strong></td>
  <td>Light / dark / system. Dark mode is true black with an amber accent — easy on the eyes at 3 am and on OLED batteries.</td>
</tr>
<tr>
  <td><strong>🔒 Fully private</strong></td>
  <td>No server, no analytics, no cookies. Every calculation happens in the browser; nothing leaves the device.</td>
</tr>
<tr>
  <td><strong>🖥 Responsive layout</strong></td>
  <td>Flat, uncluttered layout. Desktop and tablet (≥ 768 px): inputs in a left column, the plan on the right. Mobile: one column with Calculate pinned to the bottom of the screen. The plan updates live as you fill in the inputs.</td>
</tr>
</table>

---

## Clinical evidence base

All protocols and reference ranges are drawn from peer-reviewed sources:

| Reference | DOI / URL | Coverage |
|-----------|-----------|----------|
| WHO. *The Treatment of Diarrhoea*, 4th ed. | [iris.who.int](https://iris.who.int/handle/10665/43209) | Plans A / B / C; ORS composition |
| WHO. *Pocket Book of Hospital Care for Children*, 2nd ed. 2013 | [who.int](https://www.who.int/publications/i/item/978-92-4-154837-3) | Plans A–C; SAM dehydration and shock (Chart 8) |
| WHO. Guideline on wasting and nutritional oedema, 2023 | [iris.who.int](https://iris.who.int/handle/10665/376075) | SAM criteria; rehydration fluid (B6–B8) |
| King CK et al. *MMWR* 2003;52(RR-16) | [cdc.gov](https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5216a1.htm) | Ongoing-loss replacement; CDC/AAP severity table |
| Goldman RD et al. *Pediatrics* 2008;122(3) | [10.1542/peds.2007-3141](https://doi.org/10.1542/peds.2007-3141) | CDS validation |
| Holliday MA, Segar WE. *Pediatrics* 1957;19(5) | [10.1542/peds.19.5.823](https://doi.org/10.1542/peds.19.5.823) | Holliday–Segar maintenance formula |
| NICE CG84 (2009) | [nice.org.uk/cg84](https://www.nice.org.uk/guidance/cg84) | Gastroenteritis in under-5s |
| Guarino A et al. *JPGN* 2014;59(1) | [10.1097/MPG.0000000000000375](https://doi.org/10.1097/MPG.0000000000000375) | ESPGHAN/ESPID guidelines; ESPGHAN ORS |
| Lazzerini M, Wanzira H. *Cochrane* 2016 | [10.1002/14651858.CD005436.pub5](https://doi.org/10.1002/14651858.CD005436.pub5) | Oral zinc for childhood diarrhoea |
| Feizizadeh S et al. *Pediatrics* 2014;134(1) | [10.1542/peds.2013-3950](https://doi.org/10.1542/peds.2013-3950) | *S. boulardii* for acute diarrhoea |
| Pérez-Gaxiola G et al. *Cochrane* 2018 | [10.1002/14651858.CD011526.pub2](https://doi.org/10.1002/14651858.CD011526.pub2) | Smectite for acute diarrhoea |
| Liang Y et al. *Cochrane* 2019 | [10.1002/14651858.CD009359.pub2](https://doi.org/10.1002/14651858.CD009359.pub2) | Racecadotril (little benefit) |
| Fedorowicz Z et al. *Cochrane* 2011 | [10.1002/14651858.CD005506.pub5](https://doi.org/10.1002/14651858.CD005506.pub5) | Ondansetron |
| Schnadower D; Freedman SB et al. *NEJM* 2018 | [LGG](https://doi.org/10.1056/NEJMoa1802598) · [combination](https://doi.org/10.1056/NEJMoa1802597) | Probiotic RCTs (no benefit) |
| MSF, ACF, MoHFW India, Kenya MoH | see [`docs/SAM-PROTOCOLS.md`](./docs/SAM-PROTOCOLS.md) | SAM protocols |
| GASTROSAM. *Lancet Child Adolesc Health* 2026 | [10.1016/S2352-4642(25)00371-2](https://doi.org/10.1016/S2352-4642(25)00371-2) | ORS vs ReSoMal in SAM |
| ANSM (France), 28 Feb 2019 | [ansm.sante.fr](https://ansm.sante.fr/actualites/medicaments-a-base-dargile-dans-le-traitement-symptomatique-de-la-diarrhee-aigue-chez-lenfant) | Diosmectite not under 2 years (lead traces) |

---

## Languages

The app, the bedside sheet and the reference tables are complete in all five languages,
including the formulas and units in show-the-maths. `node tests/calc.test.js` fails if any
language is missing a string. Language is detected from the browser on first visit and
persisted across sessions.

| Flag | Code | Language | Notes |
|------|------|----------|-------|
| 🇬🇧 | `en` | English | Default |
| 🇰🇷 | `kr` | 한국어 | Korean |
| 🇫🇷 | `fr` | Français | Uses *racécadotril*, *diosmectite* per French clinical convention |
| 🇷🇺 | `ru` | Русский | References Регидрон® (Na⁺ 90 mmol/L) for CIS context |
| 🇨🇳 | `zh` | 中文 | Simplified Chinese; references ORS-III (低渗型) and diosmectite (蒙脱石散) per Chinese practice |

---

## Institution parameters

Open **Settings → Institution** to configure for your ward. Settings are saved in
`localStorage` and persist across sessions — no backend required.

| Parameter | Options | Default |
|-----------|---------|---------|
| Institution name, department / ward | free text | — |
| Logo | any image (stored on this device only; not in the setup link) | — |
| IV fluid (Plan C) | Ringer's lactate · Normal saline · Plasma-Lyte | Ringer's lactate |
| ORS dose (Plan B) | 50 mL/kg · **60 mL/kg** · 75 mL/kg · 100 mL/kg | 75 mL/kg |
| Rehydration duration (Plan B) | 3 h · **4 h** · 6 h | 4 h |
| Plan C approach | WHO 30/70 schedule · AAP bolus-first | WHO |
| "Some" dehydration deficit | 1–9% (adjustable) | 6% |
| "Severe" dehydration deficit | 5–15% (adjustable) | 10% |
| Zinc reminder | On / Off | On |
| Ondansetron note | On / Off | On |
| NG-ORS note | On / Off | On |
| Racecadotril note | On / Off | Off |
| Smectite / diosmectite note (over 2 years only) | On / Off | Off |
| *S. boulardii* / probiotic note | On / Off | Off |
| Malnutrition screen | Optional · Required before any plan · Off | Optional |
| SAM protocol | WHO · MSF · ACF · India · Kenya | WHO |
| Oral fluid for SAM | As the protocol specifies · Low-osmolarity ORS (no ReSoMal) | As protocol |

**Setup link.** *Settings → Setup link* turns the current settings into a URL, for example

```
https://prhehydrate.robbiemed.org/?lang=fr&method=who&name=CHR%20Saint-Louis&dept=P%C3%A9diatrie&cAppr=who&sam=required&samp=who
```

Parameters: `lang` (en·kr·fr·ru·zh), `method` (cds·who·weight·percent), `name`, `dept`,
`iv` (rl·ns·plasmalyte), `bRate` (50·60·75·100), `bHours` (3·4·6), `cAppr` (who·bolus),
`some` (1–9), `severe` (5–15), `zinc`·`onda`·`ng`·`race`·`smec`·`sbou` (0·1),
`sam` (off·optional·required), `samp` (who·msf·acf·india·kenya), `samf` (auto·ors).
Invalid values are ignored; the query is removed from the address bar once applied.

The **60 mL/kg** option follows ESPGHAN moderate-dehydration guidance (European standard).
The **3-hour** rapid schedule is used in some high-volume ED settings.

---

## Architecture

Plain HTML + CSS + vanilla JS. **No framework. No build step. No dependencies.**

```
index.html              # single-page app shell; all panels rendered by JS
css/styles.css          # CSS custom properties for theming; no preprocessor
js/i18n.js              # window.I18N — core strings, 5 languages
js/i18n-sam.js          # SAM, show-the-maths (formulas, units), setup link — 5 languages
js/i18n-sheet.js        # bedside sheet, logo — 5 languages
js/calc.js              # every formula, as pure functions returning their working
js/sam.js               # the five SAM protocols, with page-level sources
js/sheet.js             # bedside sheet: plan → timed checklist rows, and its layout
js/app.js               # UI, state, persistence, rendering
tables.html             # clinical reference tables page
js/tables.js            # reference tables as data (EN · FR) + live formula source
js/tables-kr.js         # Korean, Russian and Chinese strings for the tables page,
js/tables-ru.js         #   keyed by the English text
js/tables-zh.js
tests/calc.test.js      # node tests for calc.js, sam.js and sheet.js (no dependencies)
docs/SAM-PROTOCOLS.md   # source excerpts behind every SAM number
manifest.webmanifest    # PWA metadata: name, icons, display, theme colours
sw.js                   # service worker: cache-first assets, network-first HTML
icon.svg                # app icon (standard)
icon-maskable.svg       # app icon (maskable, for Android adaptive icons)
CNAME                   # prhehydrate.robbiemed.org
.nojekyll               # disables GitHub Pages Jekyll processing
.github/workflows/      # deploy.yml — publishes root on push to main
```

**No localStorage data ever transmitted.** Clinical inputs, institution settings, and language
preference are all stored client-side only.

---

## Running locally

```bash
git clone https://github.com/robbie-med/rhehydrate.git
cd rhehydrate
python3 -m http.server 8000
# open http://localhost:8000
```

Run the formula tests with `node tests/calc.test.js`.

The service worker requires `http://localhost` (or HTTPS) to register. Any static file
server works — `npx serve`, `caddy file-server`, etc.

---

## Deployment

Hosted on **GitHub Pages** via a GitHub Actions workflow.

1. Fork or clone the repository
2. In **Settings → Pages**, set source to **GitHub Actions**
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` publishes automatically

To publish a new version:
1. Bump `APP_VERSION` in `js/app.js`
2. Bump `VERSION` in `sw.js` and the `?v=` on every `<script>`/`<link>` in `index.html` and
   `tables.html` (versioned URLs stop browsers mixing old and new files; the tests check they agree)
3. Push to `main`

---

## Acknowledgements

Dedicated with gratitude to my Peds night senior, **P. C. B.**, and the dear patients at CHR de Saint-Louis.

Diarrhoea remains a leading cause of preventable death in children under five. Oral
rehydration therapy — simple, cheap, and available anywhere — is among the most effective
medical interventions ever described. This tool exists to put it one tap away.

---

## License

[MIT](./LICENSE) © 2026 robbie.med
