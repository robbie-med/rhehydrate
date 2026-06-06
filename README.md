<div align="center">

# PRhehydrate

**Evidence-based pediatric dehydration severity & rehydration protocol calculator**

[![Live](https://img.shields.io/badge/live-prhehydrate.robbiemed.org-c89a3c?style=flat-square&logo=github-pages&logoColor=white)](https://prhehydrate.robbiemed.org)
[![PWA](https://img.shields.io/badge/PWA-offline--first-4ec87a?style=flat-square&logo=pwa&logoColor=white)](https://prhehydrate.robbiemed.org)
[![Languages](https://img.shields.io/badge/languages-EN·KR·FR·RU·ZH-9e9488?style=flat-square)](#languages)
[![License](https://img.shields.io/badge/license-MIT-555?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.3.0-888?style=flat-square)](#)

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
| **Measured weight loss** | `% deficit = (well weight − current) ÷ well weight × 100` |
| **Direct % entry** | Clinician override for experienced estimation |

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
  <td>🇬🇧 English · 🇰🇷 한국어 · 🇫🇷 Français · 🇷🇺 Русский · 🇨🇳 中文 — full UI and clinical content, 203 keys each. Switch via flag selector; preference persisted.</td>
</tr>
<tr>
  <td><strong>🏥 Institution parameters</strong></td>
  <td>Configurable IV fluid choice, ORS dose, rehydration duration, Plan C approach, deficit thresholds, and adjunct note visibility. All settings saved locally — no account needed.</td>
</tr>
<tr>
  <td><strong>🌗 Thoughtful theming</strong></td>
  <td>Light / dark / system. Dark mode uses a pure charcoal palette with amber gold accent — zero blue, zero eye strain at 3 am.</td>
</tr>
<tr>
  <td><strong>🔒 Fully private</strong></td>
  <td>No server, no analytics, no cookies. Every calculation happens in the browser; nothing leaves the device.</td>
</tr>
<tr>
  <td><strong>🖥 Responsive layout</strong></td>
  <td>Sticky two-column on desktop (inputs left, results right); single-column on mobile portrait. Print-ready output.</td>
</tr>
</table>

---

## Clinical evidence base

All protocols and reference ranges are drawn from peer-reviewed sources:

| Reference | DOI / URL | Coverage |
|-----------|-----------|----------|
| WHO. *The Treatment of Diarrhoea*, 4th ed. | [iris.who.int](https://iris.who.int/handle/10665/43209) | Plans A / B / C; ORS composition |
| Goldman RD et al. *Pediatrics* 2008;122(3) | [10.1542/peds.2007-2376](https://doi.org/10.1542/peds.2007-2376) | CDS validation |
| Holliday MA, Segar WE. *Pediatrics* 1957;19(5) | [10.1542/peds.19.5.823](https://doi.org/10.1542/peds.19.5.823) | Holliday–Segar maintenance formula |
| NICE CG84 (2009) | [nice.org.uk/cg84](https://www.nice.org.uk/guidance/cg84) | Gastroenteritis in under-5s |
| Guarino A et al. *JPGN* 2014;59(1) | [10.1097/MPG.0000000000000375](https://doi.org/10.1097/MPG.0000000000000375) | ESPGHAN/ESPID guidelines; ESPGHAN ORS |
| Lazzerini M, Wanzira H. *Cochrane* 2016 | [10.1002/14651858.CD005436.pub5](https://doi.org/10.1002/14651858.CD005436.pub5) | Oral zinc for childhood diarrhoea |
| Feizizadeh S et al. *Pediatrics* 2014;134(1) | [10.1542/peds.2013-3950](https://doi.org/10.1542/peds.2013-3950) | *S. boulardii* for acute diarrhoea |
| Florez ID et al. *PLOS ONE* 2020;15(3) | [10.1371/journal.pone.0229482](https://doi.org/10.1371/journal.pone.0229482) | Diosmectite meta-analysis |

---

## Languages

The full UI — every label, tooltip, plan text, and education section — is translated into
five languages. Language is persisted across sessions.

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
| IV fluid (Plan C) | Ringer's lactate · Normal saline · Plasma-Lyte | Ringer's lactate |
| ORS dose (Plan B) | 50 mL/kg · **60 mL/kg** · 75 mL/kg · 100 mL/kg | 75 mL/kg |
| Rehydration duration (Plan B) | 3 h · **4 h** · 6 h | 4 h |
| Plan C approach | WHO 30/70 schedule · AAP bolus-first | WHO |
| "Some" dehydration deficit | 2–9% (adjustable) | 7.5% |
| "Severe" dehydration deficit | 5–15% (adjustable) | 10% |
| Zinc reminder | On / Off | On |
| Ondansetron note | On / Off | On |
| NG-ORS note | On / Off | On |
| Racecadotril note | On / Off | Off |
| Smectite / diosmectite note | On / Off | Off |
| *S. boulardii* / probiotic note | On / Off | Off |

The **60 mL/kg** option follows ESPGHAN moderate-dehydration guidance (European standard).
The **3-hour** rapid schedule is used in some high-volume ED settings.

---

## Architecture

Plain HTML + CSS + vanilla JS. **No framework. No build step. No dependencies.**

```
index.html              # single-page app shell; all panels rendered by JS
css/styles.css          # CSS custom properties for theming; no preprocessor
js/i18n.js              # window.I18N — 5 × 203 translation keys, loaded first
js/app.js               # all logic: scoring, calculation, rendering, persistence
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
2. Bump `CACHE` in `sw.js` (forces all installed PWAs to fetch fresh assets)
3. Push to `main`

---

## Acknowledgements

Dedicated with gratitude to my night senior, **P. C. B.**, whose steady on-call mentorship
shaped the care behind this tool.

Diarrhoea remains a leading cause of preventable death in children under five. Oral
rehydration therapy — simple, cheap, and available anywhere — is among the most effective
medical interventions ever described. This tool exists to put it one tap away.

---

## License

[MIT](./LICENSE) © 2026 robbie.med
