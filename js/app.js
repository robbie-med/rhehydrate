/* PRhehydrate — application logic (vanilla, offline-first) */
(function () {
  "use strict";

  var APP_VERSION = "1.3.0";
  var LS = { lang: "rh.lang", theme: "rh.theme", inputs: "rh.inputs", inst: "rh.inst" };

  var LANGS = ["en", "kr", "fr", "ru", "zh"];
  var FLAGS  = { en: "🇬🇧", kr: "🇰🇷", fr: "🇫🇷", ru: "🇷🇺", zh: "🇨🇳" };
  var LOCALES = { en: "en-US", kr: "ko-KR", fr: "fr-FR", ru: "ru-RU", zh: "zh-CN" };
  var HTML_LANGS = { en: "en", kr: "ko", fr: "fr", ru: "ru", zh: "zh" };
  var IV_NOTE_LABEL = { en: "IV fluid: ", kr: "정맥 수액: ", fr: "Soluté IV : ", ru: "В/В раствор: " };

  var REFS = [
    { url: "https://iris.who.int/handle/10665/43209",            key: "edu.refs.1" },
    { url: "https://doi.org/10.1542/peds.2007-2376",             key: "edu.refs.2" },
    { url: "https://doi.org/10.1542/peds.19.5.823",              key: "edu.refs.3" },
    { url: "https://www.nice.org.uk/guidance/cg84",              key: "edu.refs.4" },
    { url: "https://doi.org/10.1097/MPG.0000000000000375",       key: "edu.refs.5" },
    { url: "https://doi.org/10.1002/14651858.CD005436.pub5",     key: "edu.refs.6" },
    { url: "https://doi.org/10.1542/peds.2013-3950",             key: "edu.refs.7" },
    { url: "https://doi.org/10.1371/journal.pone.0229482",       key: "edu.refs.8" }
  ];

  // ── default institution config ──────────────────────────────────────
  var INST_DEFAULTS = {
    name:             "",
    dept:             "",
    ivFluid:          "rl",
    planBRate:        75,
    planBHours:       4,
    planCAppr:        "who",
    somePct:          7.5,
    severePct:        10,
    showZinc:         true,
    showOnda:         true,
    showNgOrs:        true,
    showRacecadotril: false,
    showSmectite:     false,
    showSboulardii:   false
  };

  // ── state ───────────────────────────────────────────────────────────
  var state = {
    lang:   "en",
    theme:  "system",
    method: "cds",
    cds: { appearance: null, eyes: null, mucous: null, tears: null },
    who: { condition: null, eyes: null, thirst: null, skin: null },
    inst: Object.assign({}, INST_DEFAULTS)
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function t(key, vars) {
    var dict = window.I18N[state.lang] || window.I18N.en;
    var s = (key in dict) ? dict[key] : (window.I18N.en[key] || key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return (k in vars) ? vars[k] : "{" + k + "}"; });
    return s;
  }

  function fmt(n) {
    if (n == null || isNaN(n)) return "—";
    var r = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
    return r.toLocaleString(LOCALES[state.lang] || "en-US");
  }

  // ── i18n ────────────────────────────────────────────────────────────
  function applyI18n() {
    document.documentElement.lang = HTML_LANGS[state.lang] || state.lang;
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
    $("#langToggle").textContent = FLAGS[state.lang] || state.lang.toUpperCase();
    // update selects that carry data-i18n on options
    $$("select option[data-i18n]").forEach(function (o) {
      o.textContent = t(o.getAttribute("data-i18n"));
    });
    buildScales();
    buildEdu();
    buildAbout();
    syncInstUI();
    updateInstTag();
    $("#verOut").textContent = APP_VERSION;
    if (lastResult) renderResults(lastResult);
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

  function syncSeg(sel, attr, val) {
    $$(sel + " .seg").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-" + attr) === val);
    });
  }
  function syncValSeg(sel, val) {
    $$(sel + " .seg").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-val") === String(val ? 1 : 0));
    });
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
        if (lastResult) calculate();
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

  function cdsScore() {
    var s = 0, complete = true;
    CDS_ITEMS.forEach(function (i) {
      if (state.cds[i] == null) complete = false; else s += state.cds[i];
    });
    return { score: s, complete: complete };
  }
  function updateCdsScore() {
    var r = cdsScore();
    $("#cdsScore").textContent = r.score + " / 8";
  }

  // ── severity logic ───────────────────────────────────────────────────
  function deriveSeverity(weight) {
    var somePct   = state.inst.somePct;
    var severePct = state.inst.severePct;

    if (state.method === "cds") {
      var r = cdsScore(); if (!r.complete) return null;
      if (r.score === 0)  return { key: "none",   pct: 0 };
      if (r.score <= 4)   return { key: "some",   pct: somePct };
      return                     { key: "severe", pct: severePct };
    }
    if (state.method === "who") {
      var sev = 0, some = 0, done = 0;
      WHO_ITEMS.forEach(function (i) {
        var v = state.who[i]; if (v == null) return; done++;
        if (v === 2) sev++; else if (v === 1) some++;
      });
      if (done < WHO_ITEMS.length) return null;
      if (sev >= 2) return { key: "severe", pct: severePct };
      if ((some + sev) >= 2) return { key: "some", pct: somePct };
      return { key: "none", pct: 0 };
    }
    if (state.method === "weight") {
      var well = parseFloat($("#wellWeight").value);
      if (!well || !weight || well <= weight) return null;
      var p = (well - weight) / well * 100;
      return { key: pctToKey(p, somePct, severePct), pct: Math.min(p, 15) };
    }
    if (state.method === "percent") {
      var p2 = parseFloat($("#pctRange").value);
      return { key: pctToKey(p2, somePct, severePct), pct: p2 };
    }
    return null;
  }
  function pctToKey(p, somePct, severePct) {
    if (p < somePct)   return "none";
    if (p < severePct) return "some";
    return "severe";
  }

  // ── maintenance (Holliday–Segar) ─────────────────────────────────────
  function maintenanceDaily(w) {
    if (w <= 10) return w * 100;
    if (w <= 20) return 1000 + (w - 10) * 50;
    return 1500 + (w - 20) * 20;
  }

  // ── calculate ────────────────────────────────────────────────────────
  var lastResult = null;

  function calculate() {
    var weight = parseFloat($("#weight").value);
    if (!weight || weight <= 0) { flashWeight(); return; }
    var sev = deriveSeverity(weight);
    if (!sev) { lastResult = null; renderEmpty(); return; }

    var months  = ageMonths();
    var stools  = Math.max(0, parseInt($("#stools").value, 10) || 0);
    var emesis  = Math.max(0, parseInt($("#emesis").value, 10) || 0);
    var deficitVol = sev.pct * weight * 10;
    var maint24    = maintenanceDaily(weight);
    var maintHr    = maint24 / 24;
    var lossVol    = stools * 10 * weight + emesis * 2 * weight;

    lastResult = { weight, months, sev, deficitVol, maint24, maintHr, stools, emesis, lossVol };
    renderResults(lastResult);
    persist();
  }

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
  function renderEmpty() {
    $("#printBtn").hidden = true;
    $("#resultsBody").innerHTML = '<p class="empty">' + t("res.empty") + "</p>";
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function liList(items) {
    var ul = document.createElement("ul");
    items.forEach(function (h) { if (h) ul.appendChild(el("li", null, h)); });
    return ul;
  }

  // ── render results ────────────────────────────────────────────────────
  function renderResults(R) {
    var body = $("#resultsBody"); body.innerHTML = "";
    var key  = R.sev.key;
    var inst = state.inst;

    // institution header (if name set)
    if (inst.name) {
      var ih = el("div", "plan-inst");
      ih.textContent = inst.name + (inst.dept ? " · " + inst.dept : "");
      body.appendChild(ih);
    }

    // severity banner
    var banner = el("div", "sev-banner sev-" + key);
    banner.appendChild(el("span", "dot"));
    var bt = el("div");
    bt.appendChild(el("div", "sev-name", t("sev." + key)));
    bt.appendChild(el("div", "sev-sub",  t("res.disclaimerShort")));
    banner.appendChild(bt);
    body.appendChild(banner);

    // metrics grid
    var metrics = el("div", "metrics");
    metrics.appendChild(metric(t("res.deficitPct"),  fmt(R.sev.pct) + "<small>%</small>"));
    metrics.appendChild(metric(t("res.deficitVol"),  fmt(R.deficitVol) + "<small> mL</small>"));
    metrics.appendChild(metric(t("res.maint24"),     fmt(R.maint24) + "<small> mL/day</small>"));
    metrics.appendChild(metric(t("res.maintHr"),     fmt(R.maintHr) + "<small> mL/h</small>"));
    if (R.lossVol > 0) {
      metrics.appendChild(metric(t("res.losses"), fmt(R.lossVol) + "<small> mL</small>"));
    }
    body.appendChild(metrics);

    body.appendChild(buildPlan(R));
    body.appendChild(buildRedFlags());
    body.appendChild(el("p", "note", t("res.maintNote")));
    body.appendChild(el("p", "disclaimer-mini", t("about.disclaimer.p")));

    $("#printBtn").hidden = false;
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

    if (key === "none") {
      head.textContent = t("plan.a.title");
      var items = [t("plan.a.1"), t("plan.a.2"),
        t("plan.a.3", { stool: fmt(10 * w), emesis: fmt(2 * w) })];
      if (ins.showZinc) items.push(t("plan.a.4"));
      items.push(t("plan.a.5"));
      body.appendChild(liList(items));

    } else if (key === "some") {
      head.textContent = t("plan.b.title");
      var rate  = ins.planBRate;
      var hours = ins.planBHours;
      var vol   = rate * w;
      body.appendChild(el("div", "plan-dose",
        t("plan.b.dose", { vol: fmt(vol), rate: rate, hours: hours })));
      var its = [t("plan.b.1")];
      if (ins.showOnda)         its.push(t("plan.b.2"));
      its.push(t("plan.b.3", { losses: fmt(R.lossVol) }));
      its.push(t("plan.b.4", { hours: hours }));
      if (ins.showNgOrs)        its.push(t("plan.b.5"));
      if (ins.showRacecadotril) its.push(t("plan.b.racecadotril"));
      if (ins.showSmectite)     its.push(t("plan.b.smectite"));
      if (ins.showSboulardii)   its.push(t("plan.b.sboulardii"));
      body.appendChild(liList(its));

    } else {
      head.textContent = t("plan.c.title");
      var total = 100 * w, first = 30 * w, rest = 70 * w, bolus = 20 * w;

      if (ins.planCAppr === "bolus") {
        body.appendChild(el("div", "plan-dose",
          t("plan.c.bolus", { bolus: fmt(bolus) })));
        body.appendChild(liList([
          t("plan.c.1"), t("plan.c.2"), t("plan.c.3"), t("plan.c.4")
        ]));
      } else {
        body.appendChild(el("div", "plan-dose",
          t("plan.c.fluid", { vol: fmt(total), fluid: fluidName })));
        var witems = [];
        if (R.months == null) {
          witems.push(t("plan.c.infant", { first: fmt(first), rest: fmt(rest) }));
          witems.push(t("plan.c.child",  { first: fmt(first), rest: fmt(rest) }));
        } else if (R.months < 12) {
          witems.push(t("plan.c.infant", { first: fmt(first), rest: fmt(rest) }));
        } else {
          witems.push(t("plan.c.child",  { first: fmt(first), rest: fmt(rest) }));
        }
        witems.push(t("plan.c.1"), t("plan.c.2"), t("plan.c.3"), t("plan.c.4"));
        body.appendChild(liList(witems));
        var fnote = el("p", "note");
        fnote.textContent = (IV_NOTE_LABEL[state.lang] || "IV fluid: ") + fluidName;
        body.appendChild(fnote);
      }
    }

    plan.appendChild(head); plan.appendChild(body);
    return plan;
  }

  function buildRedFlags() {
    var rf = el("div", "redflags");
    rf.appendChild(el("h4", null, "⚠ " + t("rf.title")));
    rf.appendChild(liList([t("rf.1"), t("rf.2"), t("rf.3"), t("rf.4"), t("rf.5")]));
    return rf;
  }

  // ── education ────────────────────────────────────────────────────────
  function buildEdu() {
    var b = $("#eduBody"); if (!b) return;
    b.innerHTML = "";
    ["s1","s2","s3","s4","s5","s6"].forEach(function (s) {
      b.appendChild(el("h3", null, t("edu." + s + ".h")));
      b.appendChild(el("p",  null, t("edu." + s + ".p")));
    });
    b.appendChild(el("h3", null, t("edu.refs.h")));
    var ul = document.createElement("ul");
    REFS.forEach(function (ref) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = ref.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = t(ref.key);
      li.appendChild(a);
      ul.appendChild(li);
    });
    b.appendChild(ul);
  }

  // ── about ────────────────────────────────────────────────────────────
  function buildAbout() {
    var b = $("#aboutBody"); if (!b) return;
    b.innerHTML = "";
    b.appendChild(el("p", null, t("about.p1")));
    b.appendChild(el("h3", null, t("about.dedication.h")));
    var ded = el("div", "dedication");
    ded.appendChild(el("p", null, "“" + t("about.dedication.p") + "”"));
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
    syncValSeg("#instZincSeg",       ins.showZinc);
    syncValSeg("#instOndaSeg",       ins.showOnda);
    syncValSeg("#instNgSeg",         ins.showNgOrs);
    syncValSeg("#instRaceSeg",       ins.showRacecadotril);
    syncValSeg("#instSmectiteSeg",   ins.showSmectite);
    syncValSeg("#instSboulardiiSeg", ins.showSboulardii);
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
    if (lastResult) renderResults(lastResult);
  }

  function loadInst() {
    try {
      var raw = localStorage.getItem(LS.inst);
      if (raw) state.inst = Object.assign({}, INST_DEFAULTS, JSON.parse(raw));
    } catch(e) {}
  }

  function resetInst() {
    state.inst = Object.assign({}, INST_DEFAULTS);
    try { localStorage.removeItem(LS.inst); } catch(e) {}
    syncInstUI();
    updateInstTag();
    if (lastResult) renderResults(lastResult);
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
      state.inst.somePct = Math.max(1, Math.min(9, parseFloat(this.value) || 7.5)); saveInst();
    });
    $("#instSeverePct").addEventListener("change", function () {
      state.inst.severePct = Math.max(5, Math.min(15, parseFloat(this.value) || 10)); saveInst();
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

    $("#instResetBtn").addEventListener("click", function () {
      resetInst();
      var self = this, orig = this.textContent;
      this.textContent = t("inst.reset.done");
      setTimeout(function () { self.textContent = orig || t("inst.reset"); }, 1600);
    });
  }

  // ── panels ───────────────────────────────────────────────────────────
  function openPanel(name) {
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
        cds:        state.cds,
        who:        state.who
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
      if (d.cds)        state.cds = d.cds;
      if (d.who)        state.who = d.who;
      if (d.method)     setMethod(d.method);
    } catch(e) {}
  }
  function clearInputs() {
    try { localStorage.removeItem(LS.inputs); } catch(e) {}
    state.cds = { appearance: null, eyes: null, mucous: null, tears: null };
    state.who = { condition: null, eyes: null, thirst: null, skin: null };
    ["#weight","#age","#wellWeight"].forEach(function(s){ $(s).value = ""; });
    $("#stools").value = "0"; $("#emesis").value = "0";
    $("#pctRange").value = "5"; $("#pctOut").textContent = "5%";
    lastResult = null; renderEmpty();
    buildScales();
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
  function checkUpdate(btn) {
    if (!("serviceWorker" in navigator)) return;
    var orig = btn.textContent;
    btn.textContent = t("set.update.checking");
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (reg) reg.update();
      setTimeout(function () {
        btn.textContent = t("set.update.current");
        setTimeout(function(){ btn.textContent = orig; }, 1500);
      }, 800);
    });
  }

  // ── init ──────────────────────────────────────────────────────────────
  function init() {
    try {
      state.lang  = localStorage.getItem(LS.lang) ||
        (navigator.language && navigator.language.toLowerCase().indexOf("ko") === 0 ? "kr" : "en");
      state.theme = localStorage.getItem(LS.theme) || "system";
    } catch(e) {}

    loadInst();
    applyTheme();
    setMethod(state.method);
    restoreInputs();
    applyI18n();
    syncSeg("#langSeg", "lang", state.lang);
    updateInstTag();

    // language toggle (topbar) — cycles through LANGS
    $("#langToggle").addEventListener("click", function () {
      var idx = LANGS.indexOf(state.lang);
      state.lang = LANGS[(idx + 1) % LANGS.length];
      try { localStorage.setItem(LS.lang, state.lang); } catch(e) {}
      applyI18n(); syncSeg("#langSeg", "lang", state.lang);
    });
    // language seg (settings)
    $("#langSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      state.lang = b.getAttribute("data-lang");
      try { localStorage.setItem(LS.lang, state.lang); } catch(e) {}
      applyI18n(); syncSeg("#langSeg", "lang", state.lang);
    });
    // theme
    $("#themeSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      state.theme = b.getAttribute("data-theme");
      try { localStorage.setItem(LS.theme, state.theme); } catch(e) {}
      applyTheme();
    });
    // method
    $("#methodSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      setMethod(b.getAttribute("data-method"));
      persist();
    });
    // percent range
    $("#pctRange").addEventListener("input", function () {
      $("#pctOut").textContent = this.value + "%"; persist();
    });
    // panels
    $$(".iconbtn[data-panel]").forEach(function (b) {
      b.addEventListener("click", function () { openPanel(b.getAttribute("data-panel")); });
    });
    $("#sheetClose").addEventListener("click", closePanel);
    $("#overlay").addEventListener("click", function (e) { if (e.target === this) closePanel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
    // calc / reset / print
    $("#calcBtn").addEventListener("click", calculate);
    $("#resetBtn").addEventListener("click", clearInputs);
    $("#printBtn").addEventListener("click", function () { window.print(); });
    // settings actions
    $("#clearBtn").addEventListener("click", function () {
      clearInputs();
      var self = this; self.textContent = t("set.cleared");
      setTimeout(function () { self.textContent = t("set.clear"); }, 1400);
    });
    $("#updateBtn").addEventListener("click", function () { checkUpdate(this); });

    wireInstUI();

    ["#weight","#age","#ageUnit","#wellWeight","#stools","#emesis"].forEach(function (s) {
      $(s).addEventListener("change", persist);
    });
    $$(".inputs input, .inputs select").forEach(function (n) {
      n.addEventListener("change", function () { if (lastResult) calculate(); });
    });

    registerSW();
    window.addEventListener("online",  buildAbout);
    window.addEventListener("offline", buildAbout);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
