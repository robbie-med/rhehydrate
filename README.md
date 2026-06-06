# PRhehydrate

**Evidence-based pediatric dehydration severity & rehydration protocol calculator.**
A fast, offline-first, bilingual (English / 한국어) clinical decision-support web app.

🔗 **[prhehydrate.robbiemed.org](https://prhehydrate.robbiemed.org)**

---

## What it does

Enter a child's weight (and optionally age), assess severity by one of four methods,
and Rhehydrate produces a structured rehydration plan with all volumes pre-calculated:

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

- WHO — *The Treatment of Diarrhoea: a manual for physicians and senior health workers* (Plans A/B/C, low-osmolarity ORS)
- Goldman RD et al. *Validation of the Clinical Dehydration Scale.* Pediatrics, 2008
- Holliday MA, Segar WE. *The maintenance need for water in parenteral fluid therapy.* Pediatrics, 1957
- AAP / NICE CG84 — *Diarrhoea and vomiting in children under 5*

## Features

- 📴 **Offline-first** — installable PWA with a service worker; works with no network once visited
- 🌐 **Native EN / KR** — full UI and clinical content in both languages
- 🌗 **Light / dark / system** theme
- 🔒 **Private** — runs entirely in the browser; no data ever leaves the device
- ♿ Keyboard-friendly, responsive, print-ready

## Tech

Plain HTML / CSS / vanilla JS — **no build step**. Just static files.

```
index.html              # app shell
css/styles.css          # theming + layout
js/i18n.js              # EN / KR strings
js/app.js               # calculator + UI logic
manifest.webmanifest    # PWA manifest
sw.js                   # offline service worker
icon*.svg               # app icons
CNAME                   # custom domain
```

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

A service worker requires `http://localhost` or HTTPS to register.

## Deployment

Hosted on **GitHub Pages** at `rhehydrate.robbiemed.org`.

- The workflow in `.github/workflows/deploy.yml` publishes the repository root on every
  push to `main`. In **Settings → Pages**, set the source to **GitHub Actions**.
- `CNAME` pins the custom domain; `.nojekyll` disables Jekyll processing.

To bump the cached version, change `CACHE` in `sw.js` and `APP_VERSION` in `js/app.js`.

## Acknowledgements

Dedicated with gratitude to my night senior, **P. C. B.**, whose steady on-call mentorship
shaped the care behind this tool.

Helps prevent under-five diarrhoeal deaths.

## License

[MIT](./LICENSE) © 2026 robbie.med
