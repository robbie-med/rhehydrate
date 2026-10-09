/* PRhehydrate — UI, state, persistence, rendering. */
(function () {
  "use strict";

  var APP_VERSION = "1.14.0";
  var LS = { lang: "rh.lang", theme: "rh.theme", inputs: "rh.inputs", inst: "rh.inst" };
  var REPO = "https://github.com/robbie-med/rhehydrate/blob/main/";
  var C = window.RH_CALC, SAM = window.RH_SAM, SHEET = window.RH_SHEET;

  var LANGS = ["en", "kr", "fr", "ru", "zh"];
  var FLAGS  = { en: "🇬🇧", kr: "🇰🇷", fr: "🇫🇷", ru: "🇷🇺", zh: "🇨🇳" };
  var LOCALES = { en: "en-US", kr: "ko-KR", fr: "fr-FR", ru: "ru-RU", zh: "zh-CN" };
  var HTML_LANGS = { en: "en", kr: "ko", fr: "fr", ru: "ru", zh: "zh" };

  var REFS = [
    { url: "https://iris.who.int/handle/10665/43209",            key: "edu.refs.1" },
    { url: "https://doi.org/10.1542/peds.2007-3141",             key: "edu.refs.2" },
    { url: "https://doi.org/10.1542/peds.19.5.823",              key: "edu.refs.3" },
    { url: "https://www.nice.org.uk/guidance/cg84",              key: "edu.refs.4" },
    { url: "https://doi.org/10.1097/MPG.0000000000000375",       key: "edu.refs.5" },
    { url: "https://doi.org/10.1002/14651858.CD005436.pub5",     key: "edu.refs.6" },
    { url: "https://doi.org/10.1542/peds.2013-3950",             key: "edu.refs.7" },
    { url: "https://doi.org/10.1002/14651858.CD011526.pub2",     key: "edu.refs.8" },
    { url: "https://doi.org/10.1002/14651858.CD009359.pub2",     key: "edu.refs.9" },
    { url: "https://doi.org/10.1002/14651858.CD005506.pub5",     key: "edu.refs.10" },
    { url: "https://doi.org/10.1056/NEJMoa1802598",              key: "edu.refs.11" },
    { url: "https://doi.org/10.1056/NEJMoa1802597",              key: "edu.refs.12" },
    { url: "https://doi.org/10.1186/s12866-022-02464-7",         key: "edu.refs.13" },
    { url: "https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5216a1.htm", key: "edu.refs.14" },
    { url: "https://www.who.int/publications/i/item/978-92-4-154837-3", key: "edu.refs.15" },
    { url: "https://iris.who.int/handle/10665/376075",           key: "edu.refs.16" },
    { url: "https://doi.org/10.1016/S2352-4642(25)00371-2",      key: "edu.refs.17" },
    { url: "https://ansm.sante.fr/actualites/medicaments-a-base-dargile-dans-le-traitement-symptomatique-de-la-diarrhee-aigue-chez-lenfant", key: "edu.refs.18" },
    { url: "https://doi.org/10.1542/peds.2018-3083",              key: "edu.refs.19" },
    { url: "https://doi.org/10.1056/NEJMoa1101549",              key: "edu.refs.20" },
    { url: "https://www.who.int/publications/i/item/9789241510219", key: "edu.refs.21" }
  ];

  // ── institution defaults ──
  var INST_DEFAULTS = {
    name:             "",
    dept:             "",
    logo:             "", // PNG data URL; not in the setup link
    ivFluid:          "rl",
    planBRate:        75,
    planBHours:       4,
    planCAppr:        "who",
    somePct:          6,
    severePct:        10,
    showZinc:         true,
    showOnda:         true,
    showNgOrs:        true,
    showRacecadotril: false,
    showSmectite:     false,
    showSboulardii:   false,
    samScreen:        "optional",   // off | optional | required
    samProtocol:      "who",        // who | msf | acf | india | kenya
    samFluid:         "auto",       // auto | ors
    dripSet:          60,           // drops/mL of the giving set; 0 = pump
    orsSachet:        1000,         // mL made up per sachet
    zincTab:          true          // show zinc as 20 mg dispersible tablets
  };

  function samDefaults() {
    return { muac: null, oedema: null, whz: null, len: null, sex: null, hyd: null, shock: false, oralOk: true, preW: null };
  }

  // ── state ───────────────────────────────────────────────────────────
  var state = {
    lang:   "en",
    theme:  "system",
    method: "cds",
    cds: { appearance: null, eyes: null, mucous: null, tears: null },
    who: { condition: null, eyes: null, thirst: null, skin: null },
    sam: samDefaults(),
    cholera: false,
    bolusCount: 1,
    inst: Object.assign({}, INST_DEFAULTS)
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // vars: strings are used as-is, numbers are locale-formatted, {key} objects are translated
  function t(key, vars) {
    var dict = window.I18N[state.lang] || window.I18N.en;
    var s = (key in dict) ? dict[key] : (window.I18N.en[key] || key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) {
      if (!(k in vars)) return "{" + k + "}";
      var v = vars[k];
      if (typeof v === "number") return fmt(v);
      if (v && typeof v === "object" && v.key) return t(v.key, v.vars);
      return v;
    });
    return s;
  }

  // units inside working lines and unit labels
  var UNIT_RE = /\b(mL\/kg\/h|mL\/kg|mL\/h|mL\/day|mg\/kg|mg\/day|drops\/min|sachets|cups|tablets|mL|kg|mg|mm|months|min|h)\b/g;
  function lu(s) {
    return String(s).replace(UNIT_RE, function (u) { return t("u." + u); });
  }
  // formula text: "f:" keys hold the English with each number replaced by #
  function tf(s) {
    var nums = [], key = "f:" + s.replace(/\d+(?:\.\d+)?/g, function (m) { nums.push(m); return "#"; });
    var d = window.I18N[state.lang] || {};
    if (!(key in d)) return lu(s);
    var i = 0;
    return d[key].replace(/#/g, function () { return nums[i++]; });
  }
  // working values that are words
  function tw(v) {
    if (typeof v === "number") return C.n(v);
    if (window.I18N.en["sev." + v]) return t("sev." + v);
    if (window.I18N.en["w.v." + v]) return t("w.v." + v);
    return lu(v);
  }

  // displayed doses: whole units at ≥ 10, one decimal below
  function fmt(n) {
    if (n == null || isNaN(n)) return "—";
    var r = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
    return r.toLocaleString(LOCALES[state.lang] || "en-US");
  }

  // ── i18n ────────────────────────────────────────────────────────────
  function applyI18n() {
    document.documentElement.lang = HTML_LANGS[state.lang] || state.lang;
    document.title = t("app.docTitle");
    $$("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    $$("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    $$("[data-i18n-title]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n-title"));
      el.setAttribute("title", v); el.setAttribute("aria-label", v);
    });
    $$("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    $("#langToggle").textContent = FLAGS[state.lang] || state.lang.toUpperCase();
    $$("select option[data-i18n]").forEach(function (o) {
      o.textContent = t(o.getAttribute("data-i18n"));
    });
    buildScales();
    buildEdu();
    buildAbout();
    syncInstUI();
    syncSamUI();
    updateInstTag();
    $("#verOut").textContent = APP_VERSION;
    if (lastResult) renderResults(lastResult);
    if (sheetOpen()) renderSheetPreview();
  }

  // ── theme ────────────────────────────────────────────────────────────
  function applyTheme() {
    var th = state.theme;
    if (th === "system") th = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", th);
    syncSeg("#themeSeg", "theme", state.theme);
  }
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
    if (state.theme === "system") applyTheme();
  });

  // active state + aria (tabs use aria-selected, everything else aria-pressed)
  function markSeg(b, on) {
    b.classList.toggle("active", on);
    b.setAttribute(b.getAttribute("role") === "tab" ? "aria-selected" : "aria-pressed", on ? "true" : "false");
  }
  function syncSeg(sel, attr, val) {
    $$(sel + " .seg").forEach(function (b) { markSeg(b, b.getAttribute("data-" + attr) === val); });
  }
  function syncValSeg(sel, val) {
    $$(sel + " .seg").forEach(function (b) { markSeg(b, b.getAttribute("data-val") === String(val ? 1 : 0)); });
  }
  function syncStrSeg(sel, val) {
    $$(sel + " .seg").forEach(function (b) { markSeg(b, b.getAttribute("data-val") === (val == null ? "" : String(val))); });
  }

  // ── scale definitions ────────────────────────────────────────────────
  var CDS_ITEMS = ["appearance", "eyes", "mucous", "tears"];
  var WHO_ITEMS = ["condition", "eyes", "thirst", "skin"];

  function buildScales() {
    var cds = $("#cdsScale"); cds.innerHTML = "";
    CDS_ITEMS.forEach(function (item) {
      cds.appendChild(scaleItem("cds", item, t("cds." + item), [0, 1, 2], state.cds[item]));
    });
    updateCdsScore();

    var who = $("#whoScale"); who.innerHTML = "";
    WHO_ITEMS.forEach(function (item) {
      who.appendChild(scaleItem("who", item, t("who." + item), [0, 1, 2], state.who[item]));
    });
  }

  function scaleItem(group, item, label, vals, current) {
    var wrap = document.createElement("div"); wrap.className = "scale-item";
    var lab = document.createElement("span"); lab.className = "si-label"; lab.textContent = label;
    wrap.appendChild(lab);
    var opts = document.createElement("div"); opts.className = "opts";
    vals.forEach(function (v) {
      var o = document.createElement("label");
      o.className = "opt" + (current === v ? " sel" : "");
      var radio = document.createElement("input");
      radio.type = "radio"; radio.name = group + "_" + item; radio.value = v;
      radio.checked = (current === v);
      radio.addEventListener("change", function () {
        state[group][item] = v;
        $$(".opt", opts).forEach(function (x) { x.classList.remove("sel"); });
        o.classList.add("sel");
        if (group === "cds") updateCdsScore();
        persist();
        recalc();
      });
      var txt = document.createElement("span"); txt.className = "opt-t";
      txt.textContent = t(group + "." + item + "." + v);
      var pt = document.createElement("span"); pt.className = "opt-pt"; pt.textContent = v;
      o.appendChild(radio); o.appendChild(txt); o.appendChild(pt);
      opts.appendChild(o);
    });
    wrap.appendChild(opts);
    return wrap;
  }

  function updateCdsScore() {
    var s = 0;
    CDS_ITEMS.forEach(function (i) { if (state.cds[i] != null) s += state.cds[i]; });
    $("#cdsScore").textContent = s + " / 8";
  }

  // ── severity ──
  function sevLine(key, pct) {
    return C.line("w.sevPct", "institution setting: " + key + " → deficit %", key, pct, "%", null, "deriveSeverity");
  }
  // measured or entered deficit: < 3% minimal (CDC/King 2003), ≥ severe threshold severe
  var MIN_SOME_PCT = 3;
  function pctToKey(p, severePct) {
    if (p < MIN_SOME_PCT) return "none";
    if (p < severePct)    return "some";
    return "severe";
  }
  function bandLine(p, severePct, k) {
    return C.line("w.band", "< " + MIN_SOME_PCT + "% none · < " + severePct + "% some · else severe",
      C.n(p) + "%", k, "", C.SRC.king2003, "deriveSeverity");
  }
  function deriveSeverity(weight) {
    var ins = state.inst, r, pct;
    function pctFor(key) { return key === "none" ? 0 : (key === "some" ? ins.somePct : ins.severePct); }

    if (state.method === "cds" || state.method === "who") {
      r = state.method === "cds" ? C.cdsSeverity(state.cds) : C.whoSeverity(state.who);
      if (!r) return null;
      pct = pctFor(r.key);
      return { key: r.key, pct: pct, work: r.work.concat([sevLine(r.key, pct)]) };
    }
    if (state.method === "weight") {
      r = C.deficitFromWeightLoss(parseFloat($("#wellWeight").value), weight);
      if (!r) return null;
      var k = pctToKey(r.pct, ins.severePct);
      return { key: k, pct: r.pct, work: r.work.concat([bandLine(r.pct, ins.severePct, k)]) };
    }
    if (state.method === "percent") {
      var p2 = parseFloat($("#pctRange").value);
      var k2 = pctToKey(p2, ins.severePct);
      return { key: k2, pct: p2, work: [C.line("w.pctDirect", "entered by clinician", C.n(p2) + "%", p2, "%",
        null, "deriveSeverity"), bandLine(p2, ins.severePct, k2)] };
    }
    return null;
  }

  // ── calculate ────────────────────────────────────────────────────────
  var lastResult = null;

  function samScreenResult(months) {
    if (state.inst.samScreen === "off") return null;
    var band = C.whzBand(state.sam.len, state.sam.sex, months, parseFloat($("#weight").value));
    var r = C.samScreen({ muac: state.sam.muac, oedema: state.sam.oedema, whz: state.sam.whz, whzBand: band, months: months });
    r.whzBand = band;
    return r;
  }
  // no scale: fill the weight from age while the box is ticked
  function applyWeightEstimate(months) {
    var est = null;
    if ($("#weightEst").checked) {
      var e = C.weightFromAge(months);
      if (e) { est = e; $("#weight").value = C.n(e.v); }
    }
    $("#weight").classList.toggle("est", !!est);
    $("#weightEstNote").textContent = est ? t("in.weight.estNote", { w: est.v }) : "";
    return est;
  }

  // quiet = live update; the Calculate button also flags a missing weight
  function calculate(quiet) {
    var months = ageMonths();
    var est = applyWeightEstimate(months);
    var weight = parseFloat($("#weight").value);
    var screen = samScreenResult(months);
    renderSamStatus(screen);
    if (!weight || weight <= 0) {
      lastResult = null; renderEmpty();
      if (!quiet) flashWeight();
      return;
    }

    // positive SAM screen → SAM pathway instead of Plans A/B/C
    if (screen && screen.status === "pos") {
      if (!state.sam.hyd) { lastResult = null; renderMessage("res.sam.needHyd"); persist(); return; }
      lastResult = { sam: true, weight: weight, months: months, screen: screen, est: est, generic: deriveSeverity(weight) };
      renderResults(lastResult);
      persist();
      return;
    }
    if (screen && screen.status === "incomplete" && state.inst.samScreen === "required") {
      lastResult = null; renderMessage("res.sam.required"); persist(); return;
    }

    var sev = deriveSeverity(weight);
    if (!sev) { lastResult = null; renderEmpty(); return; }

    var stools  = Math.max(0, parseInt($("#stools").value, 10) || 0);
    var emesis  = Math.max(0, parseInt($("#emesis").value, 10) || 0);
    var def   = C.deficitVolume(sev.pct, weight);
    var maint = C.maintenance(weight);
    var loss  = C.ongoingLosses(stools, emesis, weight);
    var na    = C.sodiumBand(parseFloat($("#sodium").value));

    lastResult = {
      weight: weight, months: months, sev: sev, screen: screen, na: na, est: est,
      deficitVol: def.v, maint24: maint.daily, maintHr: maint.hourly,
      stools: stools, emesis: emesis, lossVol: loss.v,
      work: (est ? est.work : []).concat(sev.work, def.work, maint.work, loss.work, na ? na.work : [])
    };
    renderResults(lastResult);
    persist();
  }

  function recalc() { calculate(true); }

  function ageMonths() {
    var a = parseFloat($("#age").value);
    if (!a && a !== 0) return null;
    return $("#ageUnit").value === "years" ? a * 12 : a;
  }
  function flashWeight() {
    var el = $("#weight"); el.focus();
    el.style.borderColor = "var(--danger)";
    setTimeout(function () { el.style.borderColor = ""; }, 1200);
  }

  // ── rendering helpers ────────────────────────────────────────────────
  function setResultBtns(on) {
    $("#printBtn").hidden = !on;
    $("#sheetBtn").hidden = !on;
  }
  function renderEmpty() {
    setResultBtns(false);
    $("#resultsBody").innerHTML = '<p class="empty">' + t("res.empty") + "</p>";
  }
  function renderMessage(key) {
    setResultBtns(false);
    var b = $("#resultsBody"); b.innerHTML = "";
    b.appendChild(txt("p", "empty sam-msg", t(key)));
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  // text-only element (for anything containing user- or source-derived text)
  function txt(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function link(href, text, cls) {
    var a = txt("a", cls, text);
    a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
    return a;
  }
  function liList(items) {
    var ul = document.createElement("ul");
    items.forEach(function (h) { if (h) ul.appendChild(el("li", null, h)); });
    return ul;
  }

  // collapsible section of the results
  function group(titleKey, cls, open) {
    var d = txt("details", "group" + (cls ? " " + cls : ""));
    if (open) d.open = true;
    d.appendChild(txt("summary", null, t(titleKey)));
    return d;
  }
  function workDetails(lines, codeFile) {
    var d = txt("details", "working");
    d.appendChild(txt("summary", null, t("w.show")));
    d.appendChild(workList(lines, codeFile));
    return d;
  }
  function workList(lines, codeFile) {
    var d = txt("div", "work");
    var ul = txt("ul", "work-list");
    lines.forEach(function (l) {
      var li = txt("li");
      li.appendChild(txt("span", "wk-l", t(l.k)));
      li.appendChild(txt("code", "wk-x", tw(l.x) + " = " + tw(l.v) + (l.u ? " " + lu(l.u) : "")));
      if (l.f) li.appendChild(txt("span", "wk-f", tf(l.f)));
      if (l.src) li.appendChild(link(l.src, t("w.source") + " ↗", "wk-src"));
      ul.appendChild(li);
    });
    d.appendChild(ul);
    var foot = txt("p", "wk-foot");
    foot.appendChild(document.createTextNode(t("w.rounding") + " "));
    foot.appendChild(link(REPO + (codeFile || "js/calc.js"), t("w.code", { file: codeFile || "js/calc.js" }) + " ↗"));
    foot.appendChild(document.createTextNode(" · "));
    var f = txt("a", null, t("w.formulas")); f.href = "tables.html#formulas";
    foot.appendChild(f);
    d.appendChild(foot);
    return d;
  }

  // ── render results ────────────────────────────────────────────────────
  function renderResults(R) {
    if (R.sam) { renderSamResults(R); return; }
    var body = $("#resultsBody"); body.innerHTML = "";
    var key  = R.sev.key;
    var inst = state.inst;

    if (inst.name || inst.logo) body.appendChild(instHeader());

    var banner = el("div", "sev-banner sev-" + key);
    var bt = el("div");
    bt.appendChild(txt("div", "sev-name", t("sev." + key)));
    var sub = t("res.deficitPct") + " " + fmt(R.sev.pct) + "% · " + fmt(R.deficitVol) + " " + t("u.mL");
    if (R.na && R.na.key !== "iso") sub += " · " + t("na." + R.na.key, { na: R.na.na });
    if (R.est) sub += " · " + t("res.weightEst");
    bt.appendChild(txt("div", "sev-sub", sub));
    banner.appendChild(bt);
    body.appendChild(banner);

    // screen notes only once the screen has been answered
    if (R.screen && R.screen.status !== "incomplete") {
      R.screen.notes.forEach(function (k) { body.appendChild(txt("p", "note sam-note", t(k))); });
    }

    R.planWork = [];
    body.appendChild(buildPlan(R));
    body.appendChild(buildRedFlags());

    var fl = group("res.fluids", "fluids");
    var metrics = el("div", "metrics");
    metrics.appendChild(metric(t("res.maint24"), fmt(R.maint24) + "<small> " + t("unit.mlDay") + "</small>"));
    metrics.appendChild(metric(t("res.maintHr"), fmt(R.maintHr) + "<small> " + t("u.mL/h") + "</small>"));
    metrics.appendChild(metric(t("res.losses"), fmt(R.lossVol) + "<small> " + t("u.mL") + "</small>"));
    fl.appendChild(metrics);
    fl.appendChild(txt("p", "note", t("res.maintNote")));
    fl.appendChild(txt("p", "note", t("loss.help")));
    body.appendChild(fl);

    var wk = group("w.show", "maths");
    wk.appendChild(workList(R.work.concat(R.planWork)));
    body.appendChild(wk);

    setResultBtns(true);
  }

  function instHeader() {
    var ins = state.inst, h = txt("div", "plan-inst");
    if (ins.logo) { var i = txt("img", "plan-inst-logo"); i.src = ins.logo; i.alt = ""; h.appendChild(i); }
    h.appendChild(txt("span", null, ins.name + (ins.name && ins.dept ? " · " : "") + ins.dept));
    return h;
  }

  function metric(label, valHtml) {
    var m = el("div", "metric");
    m.appendChild(el("div", "m-l", label));
    m.appendChild(el("div", "m-v", valHtml));
    return m;
  }

  function buildPlan(R) {
    var w   = R.weight, key = R.sev.key;
    var ins = state.inst;
    var fluidName = t("inst.ivFluid." + ins.ivFluid);
    var plan = el("div", "plan");
    var head = el("div", "plan-head");
    var body = el("div", "plan-body");
    var loss = C.ongoingLosses(R.stools, R.emesis, w);
    var adj  = [];
    var naKey = R.na ? R.na.key : null;
    // hyper-/hyponatraemia advice block
    function naBlock() {
      if (!naKey || naKey === "iso") return null;
      var ph = el("div", "plan-phase tone-warn");
      ph.appendChild(txt("div", "plan-phase-label", t("plan.na.h", { na: R.na.na })));
      ph.appendChild(liList([1, 2, 3].map(function (i) { return t("plan.na." + naKey + "." + i, { fluid: fluidName }); })));
      return ph;
    }
    function naNote() { return naKey ? null : txt("p", "note", t("plan.na.unknown")); }
    function cholBlock() {
      if (!state.cholera) return null;
      var ph = el("div", "plan-phase tone-danger");
      ph.appendChild(txt("div", "plan-phase-label", t("plan.chol.h")));
      ph.appendChild(liList([t("plan.chol.1", { perStool: fmt(loss.perStool) }), t("plan.chol.2"), t("plan.chol.3")]));
      return ph;
    }
    function fluidNote() {
      if (ins.ivFluid === "ns") return txt("p", "note", t("plan.c.nsNote"));
      if (ins.ivFluid === "darrow" || ins.ivFluid === "halfns") return txt("p", "note warn", t("plan.c.hypoNote", { fluid: fluidName }));
      return null;
    }
    function adjuncts() {
      if (!adj.length) return null;
      var g = group("res.adjuncts", "adjuncts");
      g.appendChild(liList(adj));
      return g;
    }

    if (key === "none") {
      head.textContent = t("plan.a.title");
      body.appendChild(liList([t("plan.a.1"), t("plan.a.2"),
        t("plan.a.3", { stool: fmt(loss.perStool), emesis: fmt(loss.perEmesis) }), t("plan.a.5")]));
      if (ins.showZinc) adj.push(zincLine(R));
      R.planWork = loss.work.slice(0, 2);

    } else if (key === "some") {
      head.textContent = t("plan.b.title");
      var b = C.planB(w, ins.planBRate, ins.planBHours);
      body.appendChild(el("div", "plan-dose",
        t("plan.b.dose", { vol: fmt(b.vol), rate: ins.planBRate, hours: ins.planBHours, perHour: fmt(b.perHour) })));
      R.planWork = b.work;
      body.appendChild(sachetLine(R, b.vol));
      var bl = [t("plan.b.1")];
      if (R.months != null && R.months < 6) bl.push(t("plan.b.infant"));
      bl.push(t("plan.b.3", { losses: fmt(R.lossVol) }), t("plan.b.puffy"), t("plan.b.4", { hours: ins.planBHours }));
      body.appendChild(liList(bl));
      var cb = cholBlock(); if (cb) body.appendChild(cb);
      var nb = naBlock(); if (nb) body.appendChild(nb);
      var nn = naNote(); if (nn) body.appendChild(nn);
      if (ins.showOnda)         adj.push(t("plan.b.2"));
      if (ins.showNgOrs)        adj.push(t("plan.b.5"));
      if (ins.showZinc)         adj.push(zincLine(R));
      if (ins.showRacecadotril) adj.push(t("plan.b.racecadotril"));
      if (ins.showSmectite)     adj.push(t("plan.b.smectite"));
      if (ins.showSboulardii)   adj.push(t("plan.b.sboulardii"));

    } else {
      head.textContent = t("plan.c.title");
      var glu = C.glucoseBolus(w);
      var gluLine = t("plan.c.gluc", { g: fmt(glu.v) });
      var ng = C.planCNg(w);
      function routeBlock() {
        var rb = el("div", "plan-phase");
        rb.appendChild(el("div", "plan-phase-label", t("plan.c.route.h")));
        rb.appendChild(liList([t("plan.c.route.iv"), t("plan.c.route.io"),
          t("plan.c.route.ng", { rate: fmt(ng.rate), total: fmt(ng.total) })]));
        return rb;
      }

      if (naKey === "hyper") {
        // shock boluses if needed, then the remaining deficit slowly (NICE CG84)
        var pcs = C.planCBolus(w, R.deficitVol, R.maintHr, state.bolusCount);
        var slow = C.slowRehydration(pcs.remaining, R.maintHr);
        var ps1 = el("div", "plan-phase");
        ps1.appendChild(el("div", "plan-phase-label", t("plan.c.phase1.label")));
        ps1.appendChild(el("div", "plan-dose", t("plan.c.bolus", { bolus: fmt(pcs.bolus), fluid: fluidName })));
        ps1.appendChild(liList([t("plan.na.hyper.3"), t("plan.c.bolus.fluid", { fluid: fluidName })]));
        body.appendChild(ps1);
        var ps2 = el("div", "plan-phase plan-phase-2 tone-warn");
        ps2.appendChild(el("div", "plan-phase-label", t("plan.c.slow.label")));
        ps2.appendChild(bolusSelect(w));
        ps2.appendChild(el("div", "plan-calc", t("plan.c.slow.rate", {
          remaining: fmt(pcs.remaining), maint48: fmt(slow.maint48), total: fmt(slow.total), rate: fmt(slow.rate), fluid: fluidName })));
        R.planWork = pcs.work.concat(slow.work, glu.work, ng.work);
        ps2.appendChild(liList([dripLine(R, slow.rate), t("plan.na.hyper.1"), t("plan.na.hyper.2", { fluid: fluidName }), t("plan.c.4"), gluLine]));
        body.appendChild(ps2);
        body.appendChild(routeBlock());

      } else if (ins.planCAppr === "bolus") {
        var pc = C.planCBolus(w, R.deficitVol, R.maintHr, state.bolusCount);
        var ph1 = el("div", "plan-phase");
        ph1.appendChild(el("div", "plan-phase-label", t("plan.c.phase1.label")));
        ph1.appendChild(el("div", "plan-dose",
          t("plan.c.bolus", { bolus: fmt(pc.bolus), fluid: fluidName })));
        ph1.appendChild(liList([t("plan.c.bolus.repeat"), t("plan.c.bolus.fluid", { fluid: fluidName })]));
        ph1.appendChild(txt("p", "note feast", t("plan.c.feast")));
        body.appendChild(ph1);

        var ph2 = el("div", "plan-phase plan-phase-2");
        ph2.appendChild(el("div", "plan-phase-label", t("plan.c.phase2.label")));
        ph2.appendChild(bolusSelect(w));
        ph2.appendChild(el("div", "plan-calc",
          t("plan.c.phase2.rate", {
            remaining: fmt(pc.remaining),
            maint12:   fmt(pc.maint12),
            total:     fmt(pc.total),
            rate:      fmt(pc.rate)
          })));
        R.planWork = pc.work.concat(glu.work, ng.work);
        ph2.appendChild(liList([dripLine(R, pc.rate), t("plan.c.phase2.switch"), t("plan.c.4"), gluLine, t("plan.c.phase2.reassess")]));
        body.appendChild(ph2);
        body.appendChild(routeBlock());

        var varDiv = group("plan.c.var.h", "variants");
        varDiv.appendChild(liList([t("plan.c.var.cardiac"), t("plan.c.var.dysna"), t("plan.c.var.surgical")]));
        body.appendChild(varDiv);

      } else {
        var wc = C.planCWho(w, R.months);
        body.appendChild(el("div", "plan-dose",
          t("plan.c.fluid", { vol: fmt(wc.total), fluid: fluidName })));
        var witems = [];
        if (R.months == null || R.months < 12) witems.push(t("plan.c.infant", { first: fmt(wc.first), rest: fmt(wc.rest) }));
        if (R.months == null || R.months >= 12) witems.push(t("plan.c.child",  { first: fmt(wc.first), rest: fmt(wc.rest) }));
        R.planWork = wc.work.concat(glu.work, ng.work);
        if (ins.dripSet && R.months != null) {
          var d1 = C.dripRate(wc.firstRate, ins.dripSet), d2 = C.dripRate(wc.restRate, ins.dripSet);
          R.planWork = R.planWork.concat(d1.work, d2.work);
          witems.push(t("res.drip.who", { r1: fmt(wc.firstRate), d1: Math.round(d1.v), r2: fmt(wc.restRate), d2: Math.round(d2.v), gtt: ins.dripSet }));
        }
        witems.push(t("plan.c.1"), t("plan.c.2"), t("plan.c.3"), t("plan.c.4"), gluLine);
        body.appendChild(liList(witems));
        body.appendChild(txt("p", "note", t("plan.c.ivNote", { fluid: fluidName })));
        body.appendChild(routeBlock());
      }
      var fn = fluidNote(); if (fn) body.appendChild(fn);
      var cc = cholBlock(); if (cc) body.appendChild(cc);
      if (naKey === "hypo") body.appendChild(naBlock());
      var cn = naNote(); if (cn) body.appendChild(cn);
      if (ins.showZinc) adj.push(zincLine(R));
    }

    var ag = adjuncts(); if (ag) body.appendChild(ag);
    plan.appendChild(head); plan.appendChild(body);
    return plan;
  }

  // range if age unknown; tablets when the institution stocks 20 mg dispersible tablets
  function zincLine(R) {
    if (R.months == null) return t("plan.a.4");
    var z = C.zinc(R.months), s = t("plan.zinc", { mg: String(z.mg) });
    if (state.inst.zincTab) s += " " + t("plan.zinc.tab", { n: C.zincTablets(z.mg).label });
    return s;
  }
  // "{rate} mL/h ≈ {d} drops/min" when a giving set is configured; pushes the working to R.planWork
  function dripLine(R, rate) {
    var gtt = state.inst.dripSet; if (!gtt) return null;
    var d = C.dripRate(rate, gtt); R.planWork = R.planWork.concat(d.work);
    return t("res.drip", { rate: fmt(rate), d: Math.round(d.v), gtt: gtt });
  }
  function sachetLine(R, ml) {
    var s = C.sachets(ml, state.inst.orsSachet); R.planWork = R.planWork.concat(s.work);
    return txt("div", "plan-dose-sub", t("res.sachets", { n: s.n, size: state.inst.orsSachet, cups: s.cups }));
  }

  // boluses given → phase 2
  function bolusSelect(w) {
    var wrap = txt("label", "bolus-given");
    wrap.appendChild(txt("span", null, t("plan.c.bolusGiven")));
    var s = txt("select", "set-select");
    [0, 1, 2, 3].forEach(function (k) {
      var o = txt("option", null, k === 0 ? t("plan.c.bolusGiven.0")
        : t("plan.c.bolusGiven.n", { n: String(k), mlkg: String(20 * k), ml: fmt(20 * k * w) }));
      o.value = String(k); if (k === state.bolusCount) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener("change", function () {
      state.bolusCount = parseInt(this.value, 10) || 0; persist();
      if (lastResult) renderResults(lastResult);
    });
    wrap.appendChild(s);
    return wrap;
  }

  function buildRedFlags() {
    var rf = el("div", "redflags");
    rf.appendChild(el("h4", null, "⚠ " + t("rf.title")));
    rf.appendChild(liList([t("rf.1"), t("rf.2"), t("rf.3"), t("rf.4"), t("rf.5")]));
    rf.appendChild(txt("p", "note", t("rf.dys")));
    return rf;
  }

  // ── SAM results ──────────────────────────────────────────────────────
  function samCtx(R) {
    var s = state.sam;
    return { w: R.weight, months: R.months, hyd: s.hyd, shock: !!s.shock, cholera: !!state.cholera,
      oralOk: s.oralOk !== false, preW: s.preW, oedema: s.oedema || 0, fluid: state.inst.samFluid };
  }

  function renderSamResults(R) {
    var body = $("#resultsBody"); body.innerHTML = "";
    var inst = state.inst, s = state.sam;
    var P = SAM.plan(inst.samProtocol, samCtx(R));

    if (inst.name || inst.logo) body.appendChild(instHeader());

    var banner = el("div", "sev-banner sev-sam");
    var bt = el("div");
    bt.appendChild(txt("div", "sev-name", t("res.sam.banner")));
    bt.appendChild(txt("div", "sev-sub", R.screen.reasons.map(function (r) { return t(r.k, r.v); }).join(" · ")));
    banner.appendChild(bt);
    body.appendChild(banner);
    R.screen.notes.forEach(function (k) { body.appendChild(txt("p", "note sam-note", t(k))); });

    var metrics = el("div", "metrics");
    metrics.appendChild(metric(t("res.sam.hyd"), t("sam.hyd." + s.hyd) + (s.shock ? " · " + t("sam.shock") : "")));
    metrics.appendChild(metric(t("res.sam.protocol"), t(P.protocol.nameKey + ".short")));
    metrics.appendChild(metric(t("res.sam.weight"), fmt(R.weight) + "<small> " + t("u.kg") + (R.est ? " · " + t("res.weightEst") : "") + "</small>"));
    metrics.appendChild(metric(t("res.sam.fluid"), t("sam.fluid." + P.fluid)));
    body.appendChild(metrics);
    body.appendChild(workDetails(R.screen.work, "js/calc.js"));

    var plan = el("div", "plan plan-sam");
    plan.appendChild(txt("div", "plan-head", t(P.protocol.nameKey)));
    var pb = el("div", "plan-body");
    P.blocks.forEach(function (b) {
      var ph = el("div", "plan-phase" + (b.tone ? " tone-" + b.tone : ""));
      ph.appendChild(txt("div", "plan-phase-label", t(b.h, b.hv)));
      var ul = document.createElement("ul");
      b.items.forEach(function (it) { ul.appendChild(txt("li", null, t(it[0], it[1]))); });
      var bw = b.work.slice();
      if (inst.dripSet) b.work.forEach(function (l) {
        if (!l.iv) return;
        var d = C.dripRate(l.v, inst.dripSet); bw = bw.concat(d.work);
        ul.appendChild(txt("li", "drip", t("res.drip", { rate: fmt(l.v), d: Math.round(d.v), gtt: inst.dripSet })));
      });
      ph.appendChild(ul);
      if (bw.length) ph.appendChild(workDetails(bw, "js/sam.js"));
      pb.appendChild(ph);
    });
    if (P.fluid === "ors" && !state.cholera) pb.appendChild(txt("p", "note", t("sam.fluid.orsNote")));
    if (P.fluid === "orsK" && !state.cholera) pb.appendChild(txt("p", "note", t("sam.fluid.orsKNote")));
    plan.appendChild(pb);
    body.appendChild(plan);

    body.appendChild(txt("p", "note sam-evidence", t("res.sam.evidence")));

    var src = el("div", "sam-sources");
    src.appendChild(txt("h4", null, t("res.sam.sources")));
    var ul = txt("ul", "src-list");
    var list = P.protocol.sources.slice();
    list.push({ t: "WHO. Guideline on the prevention and management of wasting and nutritional oedema, 2023, definitions, B6.", u: C.SRC.who2023 });
    if (state.cholera) list.push({ t: "Médecins Sans Frontières. Management of a cholera epidemic, 5.8 Cholera and acute malnutrition.", u: C.SRC.msfCholera });
    list.push({ t: "GASTROSAM trial. Lancet Child Adolesc Health 2026.", u: C.SRC.gastrosam });
    var seen = {};
    list.forEach(function (x) {
      if (seen[x.u]) return; seen[x.u] = true;
      var li = txt("li"); li.appendChild(link(x.u, x.t)); ul.appendChild(li);
    });
    src.appendChild(ul);
    body.appendChild(src);

    setResultBtns(true);
  }

  // ── bedside sheet ────────────────────────────────────────────────────
  function buildSheet() {
    var R = lastResult, ins = state.inst, s = state.sam, sc = R.screen;
    var M = SHEET.build(R.sam ? { w: R.weight, months: R.months, inst: ins, samCtx: samCtx(R) }
      : { w: R.weight, months: R.months, inst: ins, sev: R.sev.key, deficitVol: R.deficitVol, maintHr: R.maintHr, na: R.na, cholera: state.cholera });
    M.dripSet = ins.dripSet;
    var samLabel = t("bs.sam.unk");
    if (sc && sc.status === "pos") samLabel = t("bs.sam.yes") + ": " + sc.reasons.map(function (r) { return t(r.k, r.v); }).join(" · ");
    else if (sc && sc.status === "neg") samLabel = t("bs.sam.no");
    var proto;
    if (R.sam) proto = t(M.protocol.nameKey);
    else if (R.sev.key === "none") proto = t("plan.a.title");
    else if (R.sev.key === "some") proto = t("plan.b.title");
    else proto = t("plan.c.title") + " · " + t("inst.planBApproach." + ins.planCAppr);
    var head = {
      logo: ins.logo, inst: ins.name, dept: ins.dept,
      age: R.months < 24 ? t("bs.age.m", { n: R.months }) : t("bs.age.y", { n: R.months / 12 }),
      weight: fmt(R.weight) + " " + t("u.kg") + (R.est ? " " + t("bs.weight.est") : ""),
      classLabel: R.sam ? t("bs.class.sam", { hyd: { key: "sam.hyd." + s.hyd } }) + (s.shock ? " · " + t("sam.shock") : "")
        : t("sev." + R.sev.key),
      samLabel: samLabel,
      protocolLabel: proto,
      footer: t("bs.foot", { v: APP_VERSION,
        date: new Date().toLocaleString(LOCALES[state.lang] || "en-US", { dateStyle: "medium", timeStyle: "short" }) })
    };
    return SHEET.render(M, head, t);
  }
  function sheetOpen() {
    return !$("#overlay").hidden && !$('[data-panel-body="bedside"]').hidden;
  }
  function renderSheetPreview() {
    var box = $("#sheetPreview"); box.innerHTML = "";
    if (lastResult) box.appendChild(buildSheet());
  }
  function openSheet() {
    if (!lastResult) return;
    if (lastResult.months == null) { toast(t("bs.needAge")); $("#age").focus(); return; }
    openPanel("bedside");
    renderSheetPreview();
  }
  // printing with the preview open prints the sheet only
  window.addEventListener("beforeprint", function () {
    if (!sheetOpen() || !lastResult) return;
    var box = $("#printSheet"); box.innerHTML = "";
    box.appendChild(buildSheet());
    document.documentElement.classList.add("print-sheet");
  });
  window.addEventListener("afterprint", function () {
    document.documentElement.classList.remove("print-sheet");
  });

  // ── SAM screen UI ────────────────────────────────────────────────────
  function renderSamStatus(screen) {
    var box = $("#samStatus"); box.innerHTML = "";
    box.className = "sam-status";
    if (!screen) { $("#samExtra").hidden = true; return; }
    box.classList.add("st-" + screen.status);
    var head = t("sam.status." + screen.status);
    if (screen.reasons.length) head += ": " + screen.reasons.map(function (r) { return t(r.k, r.v); }).join(" · ");
    box.appendChild(txt("strong", null, head));
    screen.notes.forEach(function (k) { box.appendChild(txt("span", "hint", t(k))); });
    var bd = screen.whzBand;
    $("#samWhzSeg").hidden = !!bd;
    $("#samWhzDerived").textContent = bd ? t("sam.whz.derived", { z: { key: "w.v." + bd.key }, cm: bd.cm, c3: bd.cut3, c2: bd.cut2 }) : "";
    $("#samExtra").hidden = screen.status !== "pos";
    var g = $("#samHydHint"); g.textContent = "";
    if (screen.status === "pos") {
      var w = parseFloat($("#weight").value), sev = w ? deriveSeverity(w) : null;
      g.textContent = sev ? t("sam.generic", { sev: { key: "sev." + sev.key } }) : "";
    }
  }

  function syncSamUI() {
    $("#samScreen").hidden = state.inst.samScreen === "off";
    var s = state.sam;
    $("#samMuac").value = s.muac == null ? "" : s.muac;
    $("#samPreW").value = s.preW == null ? "" : s.preW;
    $("#samLen").value = s.len == null ? "" : s.len;
    syncStrSeg("#samSexSeg", s.sex);
    syncStrSeg("#samWhzSeg", s.whz);
    syncStrSeg("#samOedemaSeg", s.oedema);
    syncStrSeg("#samHydSeg", s.hyd);
    syncValSeg("#samShockSeg", s.shock);
    syncValSeg("#samCholSeg", state.cholera);
    syncValSeg("#samOralSeg", s.oralOk !== false);
    var p = SAM.PROTOCOLS[state.inst.samProtocol] || SAM.PROTOCOLS.who;
    $("#samShockDef").textContent = t(p.shockDefKey);
    renderSamStatus(samScreenResult(ageMonths()));
  }

  function wireSamUI() {
    function changed() { persist(); renderSamStatus(samScreenResult(ageMonths())); recalc(); }
    function num(v) { var x = parseFloat(v); return isNaN(x) ? null : x; }
    $("#samMuac").addEventListener("input", function () { state.sam.muac = num(this.value); changed(); });
    $("#samPreW").addEventListener("input", function () { state.sam.preW = num(this.value); changed(); });
    $("#samLen").addEventListener("input", function () { state.sam.len = num(this.value); changed(); });
    function seg(sel, fn) {
      $(sel).addEventListener("click", function (e) {
        var b = e.target.closest(".seg"); if (!b) return;
        fn(b.getAttribute("data-val")); syncSamUI(); changed();
      });
    }
    seg("#samWhzSeg",    function (v) { state.sam.whz = v || null; });
    seg("#samSexSeg",    function (v) { state.sam.sex = v || null; });
    seg("#samOedemaSeg", function (v) { state.sam.oedema = parseInt(v, 10); });
    seg("#samHydSeg",    function (v) { state.sam.hyd = v; });
    seg("#samShockSeg",  function (v) { state.sam.shock = v === "1"; });
    seg("#samCholSeg",   function (v) { state.cholera = v === "1"; });
    seg("#samOralSeg",   function (v) { state.sam.oralOk = v === "1"; });
  }

  // ── education ────────────────────────────────────────────────────────
  function buildEdu() {
    var b = $("#eduBody"); if (!b) return;
    b.innerHTML = "";
    ["s1","s2","s3","s4","s5","s6","s7","s8"].forEach(function (s) {
      b.appendChild(el("h3", null, t("edu." + s + ".h")));
      b.appendChild(el("p",  null, t("edu." + s + ".p")));
    });
    b.appendChild(el("h3", null, t("edu.refs.h")));
    var ol = document.createElement("ol");
    REFS.forEach(function (ref) {
      var li = document.createElement("li");
      li.appendChild(link(ref.url, t(ref.key)));
      ol.appendChild(li);
    });
    b.appendChild(ol);
  }

  // ── about ────────────────────────────────────────────────────────────
  function buildAbout() {
    var b = $("#aboutBody"); if (!b) return;
    b.innerHTML = "";
    b.appendChild(el("p", null, t("about.p1")));
    b.appendChild(el("h3", null, t("about.dedication.h")));
    var ded = el("div", "dedication");
    ded.appendChild(el("p", null, t("about.dedication.p")));
    b.appendChild(ded);
    b.appendChild(el("h3", null, t("about.mission.h")));
    b.appendChild(el("p", null, t("about.mission.p")));
    b.appendChild(el("h3", null, t("about.disclaimer.h")));
    b.appendChild(el("p", null, t("about.disclaimer.p")));
    var swReady = !!navigator.serviceWorker && !!navigator.serviceWorker.controller;
    var pill = el("span", "status-pill " + (swReady ? "on" : "off"),
      swReady ? t("about.offline") : t("about.online"));
    var pw = el("p"); pw.appendChild(pill); b.appendChild(pw);
    b.appendChild(el("p", "hint", t("about.version") + " " + APP_VERSION));
  }

  // ── institution UI ───────────────────────────────────────────────────
  function syncInstUI() {
    var ins = state.inst;
    $("#instName").value          = ins.name;
    $("#instDept").value          = ins.dept;
    $("#instIvFluid").value       = ins.ivFluid;
    $("#instPlanBRate").value     = String(ins.planBRate);
    $("#instPlanBHours").value    = String(ins.planBHours);
    $("#instPlanCApproach").value = ins.planCAppr;
    $("#instSomePct").value       = ins.somePct;
    $("#instSeverePct").value     = ins.severePct;
    $("#instSamScreen").value     = ins.samScreen;
    $("#instSamProtocol").value   = ins.samProtocol;
    $("#instSamFluid").value      = ins.samFluid;
    $("#instDripSet").value       = String(ins.dripSet);
    $("#instOrsSachet").value     = String(ins.orsSachet);
    syncValSeg("#instZincTabSeg",    ins.zincTab);
    $("#instLogoPreview").hidden  = !ins.logo;
    if (ins.logo) $("#instLogoPreview").src = ins.logo; else $("#instLogoPreview").removeAttribute("src");
    $("#instLogoRemove").hidden   = !ins.logo;
    syncValSeg("#instZincSeg",       ins.showZinc);
    syncValSeg("#instOndaSeg",       ins.showOnda);
    syncValSeg("#instNgSeg",         ins.showNgOrs);
    syncValSeg("#instRaceSeg",       ins.showRacecadotril);
    syncValSeg("#instSmectiteSeg",   ins.showSmectite);
    syncValSeg("#instSboulardiiSeg", ins.showSboulardii);
    var ul = $("#samProtocolSources"); ul.innerHTML = "";
    (SAM.PROTOCOLS[ins.samProtocol] || SAM.PROTOCOLS.who).sources.forEach(function (x) {
      var li = txt("li"); li.appendChild(link(x.u, x.t)); ul.appendChild(li);
    });
  }

  function updateInstTag() {
    var tag = $("#instTag");
    if (state.inst.name) {
      tag.textContent = state.inst.name + (state.inst.dept ? " · " + state.inst.dept : "");
      tag.hidden = false;
    } else {
      tag.hidden = true;
    }
  }

  function saveInst() {
    try { localStorage.setItem(LS.inst, JSON.stringify(state.inst)); } catch(e) {}
    updateInstTag();
    syncSamUI();
    recalc();
  }

  function loadInst() {
    try {
      var raw = localStorage.getItem(LS.inst);
      if (raw) state.inst = Object.assign({}, INST_DEFAULTS, JSON.parse(raw));
    } catch(e) {}
    if (typeof state.inst.logo !== "string" || state.inst.logo.indexOf("data:image/png;base64,") !== 0) state.inst.logo = "";
  }

  function resetInst() {
    state.inst = Object.assign({}, INST_DEFAULTS);
    try { localStorage.removeItem(LS.inst); } catch(e) {}
    syncInstUI();
    updateInstTag();
    syncSamUI();
    recalc();
  }

  function wireInstUI() {
    ["#instName","#instDept"].forEach(function (s) {
      $(s).addEventListener("input", function () {
        var key = s === "#instName" ? "name" : "dept";
        state.inst[key] = this.value.trim();
        saveInst();
      });
    });
    $("#instIvFluid").addEventListener("change", function () {
      state.inst.ivFluid = this.value; saveInst();
    });
    $("#instPlanBRate").addEventListener("change", function () {
      state.inst.planBRate = parseFloat(this.value); saveInst();
    });
    $("#instPlanBHours").addEventListener("change", function () {
      state.inst.planBHours = parseInt(this.value, 10); saveInst();
    });
    $("#instPlanCApproach").addEventListener("change", function () {
      state.inst.planCAppr = this.value; saveInst();
    });
    $("#instSomePct").addEventListener("change", function () {
      state.inst.somePct = Math.max(1, Math.min(9, parseFloat(this.value) || INST_DEFAULTS.somePct)); saveInst();
    });
    $("#instSeverePct").addEventListener("change", function () {
      state.inst.severePct = Math.max(5, Math.min(15, parseFloat(this.value) || INST_DEFAULTS.severePct)); saveInst();
    });
    $("#instSamScreen").addEventListener("change", function () {
      state.inst.samScreen = this.value; saveInst();
    });
    $("#instSamProtocol").addEventListener("change", function () {
      state.inst.samProtocol = this.value; syncInstUI(); saveInst();
    });
    $("#instSamFluid").addEventListener("change", function () {
      state.inst.samFluid = this.value; saveInst();
    });
    $("#instDripSet").addEventListener("change", function () {
      state.inst.dripSet = parseInt(this.value, 10) || 0; saveInst();
    });
    $("#instOrsSachet").addEventListener("change", function () {
      state.inst.orsSachet = parseInt(this.value, 10) || 1000; saveInst();
    });

    function wireBoolSeg(selId, key) {
      $(selId).addEventListener("click", function (e) {
        var b = e.target.closest(".seg"); if (!b) return;
        var val = b.getAttribute("data-val") === "1";
        state.inst[key] = val;
        syncValSeg(selId, val);
        saveInst();
      });
    }
    wireBoolSeg("#instZincSeg",       "showZinc");
    wireBoolSeg("#instOndaSeg",       "showOnda");
    wireBoolSeg("#instNgSeg",         "showNgOrs");
    wireBoolSeg("#instRaceSeg",       "showRacecadotril");
    wireBoolSeg("#instSmectiteSeg",   "showSmectite");
    wireBoolSeg("#instSboulardiiSeg", "showSboulardii");
    wireBoolSeg("#instZincTabSeg",    "zincTab");

    $("#instResetBtn").addEventListener("click", function () {
      resetInst();
      var self = this, orig = this.textContent;
      this.textContent = t("inst.reset.done");
      setTimeout(function () { self.textContent = orig || t("inst.reset"); }, 1600);
    });

    $("#instLogoFile").addEventListener("change", function () {
      var f = this.files && this.files[0]; this.value = "";
      if (f) readLogo(f);
    });
    $("#instLogoRemove").addEventListener("click", function () {
      state.inst.logo = ""; saveInst(); syncInstUI();
    });

    $("#linkMakeBtn").addEventListener("click", function () {
      $("#linkOut").value = buildSetupLink();
      $("#linkRow").hidden = false;
      $("#linkOut").select();
    });
    $("#linkCopyBtn").addEventListener("click", function () {
      var v = $("#linkOut").value, btn = this;
      function done() { btn.textContent = t("inst.link.copied"); setTimeout(function () { btn.textContent = t("inst.link.copy"); }, 1500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(v).then(done, function () { $("#linkOut").select(); document.execCommand("copy"); done(); });
      } else { $("#linkOut").select(); document.execCommand("copy"); done(); }
    });
  }

  // logo → PNG data URL, ≤ 320 px
  function readLogo(file) {
    function fail() { toast(t("inst.logo.err")); }
    var fr = new FileReader();
    fr.onerror = fail;
    fr.onload = function () {
      var img = new Image();
      img.onerror = fail;
      img.onload = function () {
        var w = img.naturalWidth || 320, h = img.naturalHeight || 320;
        var k = Math.min(1, 320 / Math.max(w, h));
        var cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
        var url = "";
        try { cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); url = cv.toDataURL("image/png"); } catch (e) {}
        if (url.indexOf("data:image/png;base64,") !== 0) { fail(); return; }
        state.inst.logo = url; saveInst(); syncInstUI();
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  // ── setup link ──
  var URL_MAP = {
    name:   { k: "name",             type: "str" },
    dept:   { k: "dept",             type: "str" },
    iv:     { k: "ivFluid",          type: "enum", vals: ["rl", "ns", "plasmalyte", "darrow", "halfns"] },
    bRate:  { k: "planBRate",        type: "num",  vals: [50, 60, 75, 100] },
    bHours: { k: "planBHours",       type: "num",  vals: [3, 4, 6] },
    cAppr:  { k: "planCAppr",        type: "enum", vals: ["who", "bolus"] },
    some:   { k: "somePct",          type: "range", min: 1, max: 9 },
    severe: { k: "severePct",        type: "range", min: 5, max: 15 },
    zinc:   { k: "showZinc",         type: "bool" },
    onda:   { k: "showOnda",         type: "bool" },
    ng:     { k: "showNgOrs",        type: "bool" },
    race:   { k: "showRacecadotril", type: "bool" },
    smec:   { k: "showSmectite",     type: "bool" },
    sbou:   { k: "showSboulardii",   type: "bool" },
    sam:    { k: "samScreen",        type: "enum", vals: ["off", "optional", "required"] },
    samp:   { k: "samProtocol",      type: "enum", vals: ["who", "msf", "acf", "india", "kenya"] },
    samf:   { k: "samFluid",         type: "enum", vals: ["auto", "ors"] },
    drip:   { k: "dripSet",          type: "num",  vals: [0, 20, 60] },
    sach:   { k: "orsSachet",        type: "num",  vals: [1000, 500, 200] },
    ztab:   { k: "zincTab",          type: "bool" }
  };
  var METHODS = ["cds", "who", "weight", "percent"];

  function applyUrlConfig() {
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return false; }
    var applied = false;
    if (q.has("lang") && LANGS.indexOf(q.get("lang")) >= 0) {
      state.lang = q.get("lang"); applied = true;
      try { localStorage.setItem(LS.lang, state.lang); } catch (e) {}
    }
    if (q.has("method") && METHODS.indexOf(q.get("method")) >= 0) { state.method = q.get("method"); applied = true; }
    Object.keys(URL_MAP).forEach(function (p) {
      if (!q.has(p)) return;
      var m = URL_MAP[p], raw = q.get(p), v = null;
      if (m.type === "str")   v = raw.slice(0, 80);
      if (m.type === "enum")  v = m.vals.indexOf(raw) >= 0 ? raw : null;
      if (m.type === "num")   v = m.vals.indexOf(parseFloat(raw)) >= 0 ? parseFloat(raw) : null;
      if (m.type === "range") { var x = parseFloat(raw); v = (x >= m.min && x <= m.max) ? x : null; }
      if (m.type === "bool")  v = raw === "1" ? true : (raw === "0" ? false : null);
      if (v !== null) { state.inst[m.k] = v; applied = true; }
    });
    if (applied) {
      try { localStorage.setItem(LS.inst, JSON.stringify(state.inst)); } catch (e) {}
      try { history.replaceState(null, "", window.location.pathname + window.location.hash); } catch (e) {}
    }
    return applied;
  }

  function buildSetupLink() {
    var q = new URLSearchParams();
    q.set("lang", state.lang);
    q.set("method", state.method);
    Object.keys(URL_MAP).forEach(function (p) {
      var m = URL_MAP[p], v = state.inst[m.k];
      if (m.type === "str" && !v) return;
      q.set(p, m.type === "bool" ? (v ? "1" : "0") : String(v));
    });
    return window.location.origin + window.location.pathname + "?" + q.toString();
  }

  function toast(msg) {
    var tt = $("#toast"); tt.textContent = msg; tt.hidden = false;
    setTimeout(function () { tt.hidden = true; }, 4000);
  }

  // ── panels ───────────────────────────────────────────────────────────
  function openPanel(name) {
    $("#sheet").classList.toggle("wide", name === "bedside");
    $$("[data-panel-body]").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel-body") !== name;
    });
    if (name === "about")    buildAbout();
    if (name === "settings") syncInstUI();
    $("#overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closePanel() {
    $("#overlay").hidden = true;
    document.body.style.overflow = "";
  }

  // ── persistence ──────────────────────────────────────────────────────
  function persist() {
    try {
      localStorage.setItem(LS.inputs, JSON.stringify({
        method:     state.method,
        weight:     $("#weight").value,
        age:        $("#age").value,
        ageUnit:    $("#ageUnit").value,
        wellWeight: $("#wellWeight").value,
        pct:        $("#pctRange").value,
        stools:     $("#stools").value,
        emesis:     $("#emesis").value,
        sodium:     $("#sodium").value,
        weightEst:  $("#weightEst").checked,
        cds:        state.cds,
        who:        state.who,
        sam:        state.sam,
        cholera:    state.cholera,
        bolusCount: state.bolusCount
      }));
    } catch(e) {}
  }
  function restoreInputs() {
    try {
      var d = JSON.parse(localStorage.getItem(LS.inputs) || "null");
      if (!d) return;
      if (d.weight)     $("#weight").value     = d.weight;
      if (d.age)        $("#age").value         = d.age;
      if (d.ageUnit)    $("#ageUnit").value     = d.ageUnit;
      if (d.wellWeight) $("#wellWeight").value  = d.wellWeight;
      if (d.pct)      { $("#pctRange").value    = d.pct; $("#pctOut").textContent = d.pct + "%"; }
      if (d.stools)     $("#stools").value      = d.stools;
      if (d.emesis)     $("#emesis").value      = d.emesis;
      if (d.sodium)     $("#sodium").value      = d.sodium;
      $("#weightEst").checked = !!d.weightEst;
      if (d.cds)        state.cds = d.cds;
      if (d.who)        state.who = d.who;
      if (d.sam)        state.sam = Object.assign(samDefaults(), d.sam);
      state.cholera = !!(d.cholera || (d.sam && d.sam.cholera));
      if (d.bolusCount != null) state.bolusCount = d.bolusCount;
      if (d.method)     state.method = d.method;
    } catch(e) {}
  }
  function clearInputs() {
    try { localStorage.removeItem(LS.inputs); } catch(e) {}
    state.cds = { appearance: null, eyes: null, mucous: null, tears: null };
    state.who = { condition: null, eyes: null, thirst: null, skin: null };
    state.sam = samDefaults();
    state.cholera = false;
    state.bolusCount = 1;
    ["#weight","#age","#wellWeight","#sodium"].forEach(function(s){ $(s).value = ""; });
    $("#weightEst").checked = false; $("#weight").classList.remove("est"); $("#weightEstNote").textContent = "";
    $("#stools").value = "0"; $("#emesis").value = "0";
    $("#pctRange").value = "5"; $("#pctOut").textContent = "5%";
    lastResult = null; renderEmpty();
    buildScales();
    syncSamUI();
  }

  // ── method switching ─────────────────────────────────────────────────
  function setMethod(m) {
    state.method = m;
    syncSeg("#methodSeg", "method", m);
    $$("[data-mpanel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-mpanel") !== m;
    });
  }

  // ── service worker ────────────────────────────────────────────────────
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(function(){});
  }
  // a newer release installs and reloads the page (sw.js activate); otherwise report up to date
  function checkUpdate(btn) {
    if (!("serviceWorker" in navigator)) return;
    var orig = btn.textContent;
    btn.textContent = t("set.update.checking");
    function done(key) {
      btn.textContent = t(key);
      setTimeout(function () { btn.textContent = orig; }, 1800);
    }
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) { done("set.update.current"); return; }
      return reg.update().then(function () {
        done(reg.installing || reg.waiting ? "set.update.found" : "set.update.current");
      });
    }).catch(function () { done("set.update.offline"); });
  }

  function detectLang() {
    var nl = (navigator.language || "en").toLowerCase();
    if (nl.indexOf("ko") === 0) return "kr";
    if (nl.indexOf("fr") === 0) return "fr";
    if (nl.indexOf("ru") === 0) return "ru";
    if (nl.indexOf("zh") === 0) return "zh";
    return "en";
  }

  // ── init ──────────────────────────────────────────────────────────────
  function init() {
    try {
      state.lang  = localStorage.getItem(LS.lang) || detectLang();
      state.theme = localStorage.getItem(LS.theme) || "system";
    } catch(e) { state.lang = detectLang(); }

    loadInst();
    restoreInputs();
    var fromLink = applyUrlConfig();
    applyTheme();
    setMethod(state.method);
    applyI18n();
    syncSeg("#langSeg", "lang", state.lang);
    updateInstTag();
    if (fromLink) toast(t("toast.linkApplied") + (state.inst.name ? ": " + state.inst.name : ""));

    $("#langToggle").addEventListener("click", function () {
      var idx = LANGS.indexOf(state.lang);
      state.lang = LANGS[(idx + 1) % LANGS.length];
      try { localStorage.setItem(LS.lang, state.lang); } catch(e) {}
      applyI18n(); syncSeg("#langSeg", "lang", state.lang);
    });
    $("#langSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      state.lang = b.getAttribute("data-lang");
      try { localStorage.setItem(LS.lang, state.lang); } catch(e) {}
      applyI18n(); syncSeg("#langSeg", "lang", state.lang);
    });
    $("#themeSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      state.theme = b.getAttribute("data-theme");
      try { localStorage.setItem(LS.theme, state.theme); } catch(e) {}
      applyTheme();
    });
    $("#methodSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      setMethod(b.getAttribute("data-method"));
      persist();
      recalc();
    });
    $("#pctRange").addEventListener("input", function () {
      $("#pctOut").textContent = this.value + "%"; persist();
    });
    $$(".iconbtn[data-panel]").forEach(function (b) {
      b.addEventListener("click", function () { openPanel(b.getAttribute("data-panel")); });
    });
    $("#sheetClose").addEventListener("click", closePanel);
    $("#overlay").addEventListener("click", function (e) { if (e.target === this) closePanel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
    $("#calcBtn").addEventListener("click", function () {
      calculate(false);
      if (lastResult && window.matchMedia("(max-width: 767px)").matches) {
        $(".col-results").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    $("#resetBtn").addEventListener("click", clearInputs);
    $("#printBtn").addEventListener("click", function () { window.print(); });
    $("#sheetBtn").addEventListener("click", openSheet);
    $("#sheetPrintBtn").addEventListener("click", function () { window.print(); });
    $("#clearBtn").addEventListener("click", function () {
      clearInputs();
      var self = this; self.textContent = t("set.cleared");
      setTimeout(function () { self.textContent = t("set.clear"); }, 1400);
    });
    $("#updateBtn").addEventListener("click", function () { checkUpdate(this); });

    wireInstUI();
    wireSamUI();

    ["#weight","#age","#ageUnit","#wellWeight","#stools","#emesis","#sodium"].forEach(function (s) {
      $(s).addEventListener("change", persist);
    });
    // age notes update while typing, so nothing shifts under the next tap
    $("#age").addEventListener("input", function () { renderSamStatus(samScreenResult(ageMonths())); });
    $("#ageUnit").addEventListener("change", function () { renderSamStatus(samScreenResult(ageMonths())); });
    $("#weightEst").addEventListener("change", function () { persist(); recalc(); });
    $("#weight").addEventListener("input", function () { if (this.classList.contains("est")) { $("#weightEst").checked = false; this.classList.remove("est"); } });
    $$(".inputs input, .inputs select").forEach(function (n) {
      n.addEventListener("change", recalc);
    });

    recalc();
    registerSW();
    window.addEventListener("online",  buildAbout);
    window.addEventListener("offline", buildAbout);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
