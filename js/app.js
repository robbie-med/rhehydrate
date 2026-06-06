/* Rhehydrate — application logic (vanilla, offline-first) */
(function () {
  "use strict";

  var APP_VERSION = "1.0.0";
  var LS = {
    lang: "rh.lang",
    theme: "rh.theme",
    inputs: "rh.inputs"
  };

  // ---------- state ----------
  var state = {
    lang: "en",
    theme: "system",
    method: "cds",
    cds: { appearance: null, eyes: null, mucous: null, tears: null },
    who: { condition: null, eyes: null, thirst: null, skin: null }
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function t(key, vars) {
    var dict = window.I18N[state.lang] || window.I18N.en;
    var s = (key in dict) ? dict[key] : (window.I18N.en[key] || key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return (k in vars) ? vars[k] : "{" + k + "}"; });
    return s;
  }

  function fmt(n) { // round to friendly mL, no decimals over 10
    if (n == null || isNaN(n)) return "—";
    var r = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
    return r.toLocaleString(state.lang === "kr" ? "ko-KR" : "en-US");
  }

  // ---------- i18n application ----------
  function applyI18n() {
    document.documentElement.lang = state.lang === "kr" ? "ko" : "en";
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
    $("#langToggle").textContent = state.lang === "en" ? "한국어" : "EN";
    buildScales();
    buildEdu();
    buildAbout();
    $("#verOut").textContent = APP_VERSION;
    // re-render results if present
    if (lastResult) renderResults(lastResult);
  }

  // ---------- theme ----------
  function applyTheme() {
    var th = state.theme;
    if (th === "system") {
      th = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
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

  // ---------- scale definitions ----------
  var CDS_ITEMS = ["appearance", "eyes", "mucous", "tears"];
  var WHO_ITEMS = ["condition", "eyes", "thirst", "skin"];

  function buildScales() {
    // CDS: each 0-2
    var cds = $("#cdsScale"); cds.innerHTML = "";
    CDS_ITEMS.forEach(function (item) {
      cds.appendChild(scaleItem("cds", item, t("cds." + item), [0, 1, 2], state.cds[item]));
    });
    updateCdsScore();

    // WHO: each 0-2 (col index)
    var who = $("#whoScale"); who.innerHTML = "";
    WHO_ITEMS.forEach(function (item) {
      who.appendChild(scaleItem("who", item, t("who." + item), [0, 1, 2], state.who[item]));
    });
  }

  function scaleItem(group, item, label, vals, current) {
    var wrap = document.createElement("div");
    wrap.className = "scale-item";
    var lab = document.createElement("span");
    lab.className = "si-label"; lab.textContent = label;
    wrap.appendChild(lab);
    var opts = document.createElement("div"); opts.className = "opts";
    vals.forEach(function (v) {
      var id = group + "_" + item + "_" + v;
      var o = document.createElement("label");
      o.className = "opt" + (current === v ? " sel" : "");
      var radio = document.createElement("input");
      radio.type = "radio"; radio.name = group + "_" + item; radio.value = v; radio.id = id;
      radio.checked = current === v;
      radio.addEventListener("change", function () {
        state[group][item] = v;
        $$(".opt", opts).forEach(function (x) { x.classList.remove("sel"); });
        o.classList.add("sel");
        if (group === "cds") updateCdsScore();
        persist();
      });
      var txt = document.createElement("span");
      txt.className = "opt-t"; txt.textContent = t(group + "." + item + "." + v);
      var pt = document.createElement("span");
      pt.className = "opt-pt"; pt.textContent = v;
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

  // ---------- severity logic ----------
  // returns { key:'none'|'some'|'severe', pct:Number, source }
  function deriveSeverity(weight) {
    if (state.method === "cds") {
      var r = cdsScore();
      if (!r.complete) return null;
      if (r.score === 0) return { key: "none", pct: 0 };
      if (r.score <= 4) return { key: "some", pct: 7.5 };
      return { key: "severe", pct: 10 };
    }
    if (state.method === "who") {
      var sev = 0, some = 0, done = 0;
      WHO_ITEMS.forEach(function (i) {
        var v = state.who[i];
        if (v == null) return;
        done++;
        if (v === 2) sev++; else if (v === 1) some++;
      });
      if (done < WHO_ITEMS.length) return null;
      if (sev >= 2) return { key: "severe", pct: 10 };
      if (some >= 2 || (some + sev) >= 2) return { key: "some", pct: 7.5 };
      return { key: "none", pct: 0 };
    }
    if (state.method === "weight") {
      var well = parseFloat($("#wellWeight").value);
      if (!well || !weight || well <= weight) return null;
      var pct = (well - weight) / well * 100;
      return { key: pctToKey(pct), pct: Math.min(pct, 15) };
    }
    if (state.method === "percent") {
      var p = parseFloat($("#pctRange").value);
      return { key: pctToKey(p), pct: p };
    }
    return null;
  }
  function pctToKey(p) {
    if (p < 5) return "none";
    if (p < 10) return "some";
    return "severe";
  }

  // ---------- maintenance (Holliday–Segar) ----------
  function maintenanceDaily(w) {
    if (w <= 10) return w * 100;
    if (w <= 20) return 1000 + (w - 10) * 50;
    return 1500 + (w - 20) * 20;
  }

  // ---------- calculate ----------
  var lastResult = null;

  function calculate() {
    var weight = parseFloat($("#weight").value);
    if (!weight || weight <= 0) {
      flashWeight();
      return;
    }
    var sev = deriveSeverity(weight);
    if (!sev) { lastResult = null; renderEmpty(true); return; }

    var months = ageMonths();
    var stools = parseInt($("#stools").value, 10) || 0;
    var emesis = parseInt($("#emesis").value, 10) || 0;

    var deficitVol = sev.pct * weight * 10;            // mL
    var maint24 = maintenanceDaily(weight);            // mL/day
    var maintHr = maint24 / 24;                         // mL/h
    var lossVol = stools * 10 * weight + emesis * 2 * weight; // mL replacement

    lastResult = {
      weight: weight, months: months, sev: sev,
      deficitVol: deficitVol, maint24: maint24, maintHr: maintHr,
      stools: stools, emesis: emesis, lossVol: lossVol
    };
    renderResults(lastResult);
    persist();
  }

  function ageMonths() {
    var a = parseFloat($("#age").value);
    if (!a && a !== 0) return null;
    return $("#ageUnit").value === "years" ? a * 12 : a;
  }

  function flashWeight() {
    var el = $("#weight");
    el.focus();
    el.style.borderColor = "var(--danger)";
    setTimeout(function () { el.style.borderColor = ""; }, 1200);
  }

  // ---------- rendering ----------
  function renderEmpty(incomplete) {
    $("#printBtn").hidden = true;
    $("#resultsBody").innerHTML = '<p class="empty">' + t("res.empty") + "</p>";
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderResults(R) {
    var body = $("#resultsBody");
    body.innerHTML = "";
    var key = R.sev.key;

    // banner
    var banner = el("div", "sev-banner sev-" + key);
    banner.appendChild(el("span", "dot"));
    var bt = el("div");
    bt.appendChild(el("div", "sev-name", t("sev." + key)));
    bt.appendChild(el("div", "sev-sub", t("res.disclaimerShort")));
    banner.appendChild(bt);
    body.appendChild(banner);

    // metrics
    var metrics = el("div", "metrics");
    metrics.appendChild(metric(t("res.deficitPct"), fmt(R.sev.pct) + "<small>%</small>"));
    metrics.appendChild(metric(t("res.deficitVol"), fmt(R.deficitVol) + "<small> mL</small>"));
    metrics.appendChild(metric(t("res.maint24"), fmt(R.maint24) + "<small> mL/day</small>"));
    metrics.appendChild(metric(t("res.maintHr"), fmt(R.maintHr) + "<small> mL/h</small>"));
    if (R.lossVol > 0) {
      metrics.appendChild(metric(t("res.losses"), fmt(R.lossVol) + "<small> mL</small>"));
    }
    body.appendChild(metrics);

    // plan
    body.appendChild(buildPlan(R));

    // red flags (always shown as safety net)
    body.appendChild(buildRedFlags());

    // maintenance note + disclaimer
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

  function liList(items) {
    var ul = document.createElement("ul");
    items.forEach(function (h) { ul.appendChild(el("li", null, h)); });
    return ul;
  }

  function buildPlan(R) {
    var w = R.weight, key = R.sev.key;
    var plan = el("div", "plan");
    var head = el("div", "plan-head");
    var bodyEl = el("div", "plan-body");

    if (key === "none") {
      head.textContent = t("plan.a.title");
      bodyEl.appendChild(liList([
        t("plan.a.1"), t("plan.a.2"),
        t("plan.a.3", { stool: fmt(10 * w), emesis: fmt(2 * w) }),
        t("plan.a.4"), t("plan.a.5")
      ]));
    } else if (key === "some") {
      head.textContent = t("plan.b.title");
      var vol = 75 * w;
      var dose = el("div", "plan-dose", t("plan.b.dose", { vol: fmt(vol), rate: 75 }));
      bodyEl.appendChild(dose);
      var items = [t("plan.b.1"), t("plan.b.2")];
      items.push(t("plan.b.3", { losses: fmt(R.lossVol) }));
      items.push(t("plan.b.4"), t("plan.b.5"));
      bodyEl.appendChild(liList(items));
    } else {
      head.textContent = t("plan.c.title");
      var total = 100 * w, first = 30 * w, rest = 70 * w, bolus = 20 * w;
      bodyEl.appendChild(el("div", "plan-dose", t("plan.c.fluid", { vol: fmt(total) })));
      var lines = [];
      if (R.months == null) {
        lines.push(t("plan.c.infant", { first: fmt(first), rest: fmt(rest) }));
        lines.push(t("plan.c.child", { first: fmt(first), rest: fmt(rest) }));
      } else if (R.months < 12) {
        lines.push(t("plan.c.infant", { first: fmt(first), rest: fmt(rest) }));
      } else {
        lines.push(t("plan.c.child", { first: fmt(first), rest: fmt(rest) }));
      }
      lines.push(t("plan.c.1"), t("plan.c.2"), t("plan.c.3"));
      lines.push(t("plan.c.bolus", { bolus: fmt(bolus) }));
      lines.push(t("plan.c.4"));
      bodyEl.appendChild(liList(lines));
    }
    plan.appendChild(head); plan.appendChild(bodyEl);
    return plan;
  }

  function buildRedFlags() {
    var rf = el("div", "redflags");
    rf.appendChild(el("h4", null, "⚠ " + t("rf.title")));
    rf.appendChild(liList([t("rf.1"), t("rf.2"), t("rf.3"), t("rf.4"), t("rf.5")]));
    return rf;
  }

  // ---------- education / about content ----------
  function buildEdu() {
    var b = $("#eduBody"); if (!b) return;
    var secs = ["s1", "s2", "s3", "s4", "s5"];
    b.innerHTML = "";
    secs.forEach(function (s) {
      b.appendChild(el("h3", null, t("edu." + s + ".h")));
      b.appendChild(el("p", null, t("edu." + s + ".p")));
    });
    b.appendChild(el("h3", null, t("edu.refs.h")));
    b.appendChild(liList([t("edu.refs.1"), t("edu.refs.2"), t("edu.refs.3"), t("edu.refs.4")]));
  }

  function buildAbout() {
    var b = $("#aboutBody"); if (!b) return;
    b.innerHTML = "";
    b.appendChild(el("p", null, t("about.p1")));

    b.appendChild(el("h3", null, t("about.dedication.h")));
    var ded = el("div", "dedication");
    ded.appendChild(el("p", null, "“" + t("about.dedication.p") + "”"));
    b.appendChild(ded);

    b.appendChild(el("h3", null, t("about.sdg.h")));
    b.appendChild(el("span", "sdg-badge", "● SDG 3 — Good Health & Well-being"));
    b.appendChild(el("p", null, t("about.sdg.p")));

    b.appendChild(el("h3", null, t("about.disclaimer.h")));
    b.appendChild(el("p", null, t("about.disclaimer.p")));

    var online = navigator.onLine;
    var swReady = !!navigator.serviceWorker && !!navigator.serviceWorker.controller;
    var pill = el("span", "status-pill " + (swReady ? "on" : "off"),
      swReady ? t("about.offline") : t("about.online"));
    var pwrap = el("p"); pwrap.appendChild(pill);
    b.appendChild(pwrap);

    var ver = el("p", "hint");
    ver.textContent = t("about.version") + " " + APP_VERSION;
    b.appendChild(ver);
  }

  // ---------- panels ----------
  function openPanel(name) {
    $$("[data-panel-body]").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel-body") !== name;
    });
    if (name === "about") buildAbout();
    $("#overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closePanel() {
    $("#overlay").hidden = true;
    document.body.style.overflow = "";
  }

  // ---------- persistence ----------
  function persist() {
    try {
      var data = {
        method: state.method,
        weight: $("#weight").value,
        age: $("#age").value,
        ageUnit: $("#ageUnit").value,
        wellWeight: $("#wellWeight").value,
        pct: $("#pctRange").value,
        stools: $("#stools").value,
        emesis: $("#emesis").value,
        cds: state.cds, who: state.who
      };
      localStorage.setItem(LS.inputs, JSON.stringify(data));
    } catch (e) {}
  }
  function restore() {
    try {
      var raw = localStorage.getItem(LS.inputs);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.weight) $("#weight").value = d.weight;
      if (d.age) $("#age").value = d.age;
      if (d.ageUnit) $("#ageUnit").value = d.ageUnit;
      if (d.wellWeight) $("#wellWeight").value = d.wellWeight;
      if (d.pct) { $("#pctRange").value = d.pct; $("#pctOut").textContent = d.pct + "%"; }
      if (d.stools) $("#stools").value = d.stools;
      if (d.emesis) $("#emesis").value = d.emesis;
      if (d.cds) state.cds = d.cds;
      if (d.who) state.who = d.who;
      if (d.method) setMethod(d.method);
    } catch (e) {}
  }
  function clearInputs() {
    try { localStorage.removeItem(LS.inputs); } catch (e) {}
    state.cds = { appearance: null, eyes: null, mucous: null, tears: null };
    state.who = { condition: null, eyes: null, thirst: null, skin: null };
    ["#weight", "#age", "#wellWeight"].forEach(function (s) { $(s).value = ""; });
    $("#stools").value = "0"; $("#emesis").value = "0";
    $("#pctRange").value = "5"; $("#pctOut").textContent = "5%";
    lastResult = null; renderEmpty();
    buildScales();
  }

  // ---------- method switching ----------
  function setMethod(m) {
    state.method = m;
    syncSeg("#methodSeg", "method", m);
    $$("[data-mpanel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-mpanel") !== m;
    });
  }

  // ---------- service worker ----------
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  function checkUpdate(btn) {
    if (!("serviceWorker" in navigator)) return;
    var orig = btn.textContent;
    btn.textContent = t("set.update.checking");
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (reg) reg.update();
      setTimeout(function () { btn.textContent = t("set.update.current");
        setTimeout(function(){ btn.textContent = orig; }, 1500); }, 800);
    });
  }

  // ---------- wire up ----------
  function init() {
    // load prefs
    try {
      state.lang = localStorage.getItem(LS.lang) ||
        (navigator.language && navigator.language.toLowerCase().indexOf("ko") === 0 ? "kr" : "en");
      state.theme = localStorage.getItem(LS.theme) || "system";
    } catch (e) {}

    applyTheme();
    setMethod(state.method);
    restore();
    applyI18n();
    syncSeg("#langSeg", "lang", state.lang);

    // language toggle
    $("#langToggle").addEventListener("click", function () {
      state.lang = state.lang === "en" ? "kr" : "en";
      try { localStorage.setItem(LS.lang, state.lang); } catch (e) {}
      applyI18n(); syncSeg("#langSeg", "lang", state.lang);
    });
    $("#langSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      state.lang = b.getAttribute("data-lang");
      try { localStorage.setItem(LS.lang, state.lang); } catch (e) {}
      applyI18n(); syncSeg("#langSeg", "lang", state.lang);
    });

    // theme
    $("#themeSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      state.theme = b.getAttribute("data-theme");
      try { localStorage.setItem(LS.theme, state.theme); } catch (e) {}
      applyTheme();
    });

    // method segmented
    $("#methodSeg").addEventListener("click", function (e) {
      var b = e.target.closest(".seg"); if (!b) return;
      setMethod(b.getAttribute("data-method"));
      persist();
    });

    // percent range
    $("#pctRange").addEventListener("input", function () {
      $("#pctOut").textContent = this.value + "%";
      persist();
    });

    // panels
    $$(".iconbtn[data-panel]").forEach(function (b) {
      b.addEventListener("click", function () { openPanel(b.getAttribute("data-panel")); });
    });
    $("#sheetClose").addEventListener("click", closePanel);
    $("#overlay").addEventListener("click", function (e) { if (e.target === this) closePanel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

    // actions
    $("#calcBtn").addEventListener("click", calculate);
    $("#resetBtn").addEventListener("click", clearInputs);
    $("#printBtn").addEventListener("click", function () { window.print(); });
    $("#clearBtn").addEventListener("click", function () {
      clearInputs(); this.textContent = t("set.cleared");
      var self = this; setTimeout(function () { self.textContent = t("set.clear"); }, 1400);
    });
    $("#updateBtn").addEventListener("click", function () { checkUpdate(this); });

    // persist on input
    ["#weight", "#age", "#ageUnit", "#wellWeight", "#stools", "#emesis"].forEach(function (s) {
      $(s).addEventListener("change", persist);
    });

    // live recompute when result already shown
    $$(".inputs input, .inputs select, #methodSeg").forEach(function (n) {
      n.addEventListener("change", function () { if (lastResult) calculate(); });
    });

    registerSW();
    window.addEventListener("online", buildAbout);
    window.addEventListener("offline", buildAbout);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
