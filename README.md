# PRhehydrate

**Evidence-based pediatric dehydration severity & rehydration protocol calculator.**
A fast, offline-first, five-language clinical decision-support web app.

🔗 **[prhehydrate.robbiemed.org](https://prhehydrate.robbiemed.org)**

---

## What it does

Enter a child's weight (and optionally age), assess severity by one of four methods,
and PRhehydrate produces a structured rehydration plan with all volumes pre-calculated:

- **Severity assessment**
  - **Clinical Dehydration Scale (CDS)** — Goldman 4-item bedside scale (0–8)
  - **WHO clinical signs** — IMCI two-or-more-signs classification
  - **Measured weight loss** — `% deficit = (well − current) / well × 100`
  - **Direct % entry** — clinician override
- **Outputs**
  - Estimated deficit (% and mL, where `1% ≈ 10 mL/kg`)
  - Maintenance fluid — **Holliday–Segar** 100/50/20 mL/kg/day (4-2-1 mL/kg/h)
  - Ongoing-loss replacement (10 mL/kg per stool, 2 mL/kg per emesis)
  - Matched protocol: **WHO Plan A / B / C** with exact volumes and timing,
    plus the AAP isotonic-bolus alternative for severe disease
  - Red-flag safety net and a print/save view

> ⚕️ **Decision support only.** Not a regulated medical device. Verify every dose and
> volume against local protocol and clinical judgement.

## Clinical basis

| Reference | Topic |
|-----------|-------|
| WHO. *Treatment of Diarrhoea* (4th ed.) | Plans A/B/C, low-osmolarity ORS |
| Goldman RD et al. *Pediatrics* 2008 | Clinical Dehydration Scale validation |
| Holliday MA, Segar WE. *Pediatrics* 1957 | Holliday–Segar maintenance formula |
| NICE CG84, 2009 | Gastroenteritis in under-5s |
| Guarino A et al. *JPGN* 2014 | ESPGHAN/ESPID acute gastroenteritis guidelines |
| Lazzerini M, Wanzira H. *Cochrane* 2016 | Oral zinc for childhood diarrhoea |
| Feizizadeh S et al. *Pediatrics* 2014 | *S. boulardii* for acute diarrhoea |
| Florez ID et al. *PLOS ONE* 2020 | Diosmectite meta-analysis |

## Features

- 📴 **Offline-first** — installable PWA with a service worker; works with no network once visited
- 🌐 **Five languages** — English 🇬🇧 · 한국어 🇰🇷 · Français 🇫🇷 · Русский 🇷🇺 · 中文 🇨🇳
- 🏥 **Institution parameters** — configurable IV fluid, ORS dose (50 / 60 / 75 / 100 mL/kg), rehydration duration (3 / 4 / 6 h), Plan C approach, and deficit thresholds
- 💊 **Adjunct toggles** — zinc, ondansetron, NG-ORS, racecadotril, smectite, *S. boulardii*
- 🌗 **Light / dark / system** theme (dark mode: pure charcoal, zero blue)
- 🔒 **Private** — runs entirely in the browser; no data ever leaves the device
- ♿ Keyboard-friendly, responsive, print-ready

## Tech

Plain HTML / CSS / vanilla JS — **no build step**. Just static files.

```
index.html              # app shell
css/styles.css          # theming + layout
js/i18n.js              # EN · KR · FR · RU · ZH strings (~195 keys × 5 languages)
js/app.js               # calculator + UI logic
manifest.webmanifest    # PWA manifest
sw.js                   # offline service worker
icon*.svg               # app icons
CNAME                   # custom domain (prhehydrate.robbiemed.org)
```

## Institution parameters

Open **Settings → Institution** to customise:

| Parameter | Options |
|-----------|---------|
| IV fluid (Plan C) | Ringer's lactate · Normal saline · Plasma-Lyte |
| ORS dose (Plan B) | 50 · 60 · 75 · 100 mL/kg |
| Rehydration duration (Plan B) | 3 h · 4 h · 6 h |
| Plan C approach | WHO 30/70 · AAP bolus-first |
| "Some" deficit % | adjustable |
| "Severe" deficit % | adjustable |
| Adjuncts shown | Zinc · Ondansetron · NG-ORS · Racecadotril · Smectite · *S. boulardii* |

Settings are persisted in `localStorage` — no account required.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

A service worker requires `http://localhost` or HTTPS to register.

## Deployment

Hosted on **GitHub Pages** at `prhehydrate.robbiemed.org`.

- The workflow in `.github/workflows/deploy.yml` publishes the repository root on every
  push to `main`. In **Settings → Pages**, set the source to **GitHub Actions**.
- `CNAME` pins the custom domain; `.nojekyll` disables Jekyll processing.

To bump the cached version, change `CACHE` in `sw.js` and `APP_VERSION` in `js/app.js`.

## Acknowledgements

Dedicated with gratitude to my night senior, **P. C. B.**, whose steady on-call mentorship
shaped the care behind this tool.

## License

[MIT](./LICENSE) © 2026 robbie.med
