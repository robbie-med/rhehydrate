/* PRhehydrate — bedside rehydration sheet (printable checklist).
 *
 * build(input) turns the plan already on screen into a model the nurse can
 * work through on paper: timed rows with a box for the time given, the
 * amount taken and initials, reassessment rows, stop signs, a stool/vomit
 * tally, zinc days and a "plan changed" line. It adds no clinical content of
 * its own: every volume comes from js/calc.js or js/sam.js, and evenly split
 * slots always add up to the plan total (tests/calc.test.js checks this).
 * render(model, head, t) draws it; the same DOM is used for the on-screen
 * preview and for printing (A4 or Letter, black and white).
 *
 * input = { w, months, sev: "none"|"some"|"severe", deficitVol, maintHr,
 *           inst: institution settings, samCtx: ctx for RH_SAM.plan | null }
 */
(function (root) {
  "use strict";
  var C = root.RH_CALC, SAM = root.RH_SAM;

  // stop/overload items move from the orders into the boxed "stop" section
  var STOP_KEYS = ["sam.who.oral.5", "sam.who.shock.5", "sam.msf.overload", "sam.msf.b.4",
    "sam.acf.stop", "sam.ind.oral.4", "sam.ind.shock.5"];
  var RED_FLAGS = [["rf.1", {}], ["rf.2", {}], ["rf.3", {}], ["rf.4", {}], ["rf.5", {}]];

  // minutes → "h:mm"
  function hm(min) {
    var h = Math.floor(min / 60), m = Math.round(min - h * 60);
    return h + ":" + (m < 10 ? "0" : "") + m;
  }
  function span(a, b) { return hm(a) + "–" + hm(b); }

  // rows: { type: "head"|"dose"|"check"|"task"|"opt"|"blank", when, text: [key, vars], v, cum, approx }
  // `total` mL split evenly over `n` slots of `step` minutes from `t0`
  function slots(total, n, step, t0, cum0, text) {
    var rows = [], per = total / n;
    for (var i = 0; i < n; i++) {
      rows.push({ type: "dose", when: span(t0 + i * step, t0 + (i + 1) * step), text: text,
        v: per, cum: cum0 + per * (i + 1), approx: true });
    }
    return rows;
  }
  function dur(hours) { return hours < 1 ? Math.round(hours * 60) + " min" : hours + " h"; }

  function findItem(P, key) {
    for (var i = 0; i < P.blocks.length; i++)
      for (var j = 0; j < P.blocks[i].items.length; j++)
        if (P.blocks[i].items[j][0] === key) return P.blocks[i].items[j][1];
    return null;
  }

  // ── standard WHO plans ────────────────────────────────────────────────
  function standard(o) {
    var w = o.w, ins = o.inst, fluid = { key: "inst.ivFluid." + ins.ivFluid, short: true };
    var loss = C.ongoingLosses(0, 0, w);
    var m = {
      kind: o.sev, vitals: [], orders: [], rows: [],
      stop: { h: "bs.stop.std", items: RED_FLAGS },
      loss: { perStool: loss.perStool, perEmesis: loss.perEmesis },
      zinc: ins.showZinc ? C.zinc(o.months) : null
    };

    if (o.sev === "none") {
      m.orders.push({ h: null, items: [["plan.a.1", {}], ["plan.a.2", {}], ["plan.a.5", {}]] });
      return m;
    }

    if (o.sev === "some") {
      var b = C.planB(w, ins.planBRate, ins.planBHours);
      var items = [["plan.b.1", {}]];
      if (ins.showOnda)  items.push(["plan.b.2", {}]);
      if (ins.showNgOrs) items.push(["plan.b.5", {}]);
      m.orders.push({ h: null, items: items });
      m.rows.push({ type: "head", text: ["plan.b.dose", { vol: b.vol, hours: String(ins.planBHours), rate: String(ins.planBRate) }] });
      m.rows = m.rows.concat(slots(b.vol, ins.planBHours, 60, 0, 0, ["bs.give", { fluid: { key: "bs.ors" } }]));
      m.rows.push({ type: "check", when: hm(ins.planBHours * 60), text: ["bs.chk.b", {}] });
      return m;
    }

    // severe — IV, with pulse / breathing / urine at every row
    m.vitals = ["pulse", "rr", "urine"];
    m.loss = { perStool: null, perEmesis: null };   // Plan C gives no per-episode volume
    var ors = C.perKg("w.ors", 5, "mL/kg/h", w, "mL/h");
    m.rows.push({ type: "task", when: hm(0), text: ["bs.row.base", {}] });
    m.rows.push({ type: "task", when: "", text: ["bs.row.labs", {}] });

    if (ins.planCAppr === "bolus") {
      var pc = C.planCBolus(w, o.deficitVol, o.maintHr, 1);
      [1, 2, 3].forEach(function (k) {
        m.rows.push({ type: "task", when: k === 1 ? hm(0) : "",
          text: [k === 1 ? "bs.bolus.1" : "bs.bolus.n", { n: String(k), fluid: fluid }], v: pc.bolus,
          ifNeeded: k > 1 });
        m.rows.push({ type: "check", when: "", text: ["bs.chk.perf", {}], vit: true });
      });
      m.rows.push({ type: "head", text: ["bs.p2.h", {}] });
      [1, 2, 3].forEach(function (k) {
        var p = C.planCBolus(w, o.deficitVol, o.maintHr, k);
        m.rows.push({ type: "opt", text: ["bs.p2.opt", { n: String(k), rate: p.rate, total: p.total }] });
      });
      for (var i = 1; i <= 6; i++) {
        m.rows.push({ type: "dose", when: "P2 +" + hm(i * 120), text: ["bs.p2.row", {}] });
      }
      m.rows.push({ type: "task", when: "", text: ["bs.oral.started", {}] });
      return m;
    }

    var wc = C.planCWho(w, o.months);
    var h1 = wc.infant ? 1 : 0.5, h2 = wc.infant ? 5 : 2.5;
    m.orders.push({ h: null, items: [["plan.c.1", {}]] });
    m.rows.push({ type: "head", text: ["bs.ph.c1", { fluid: fluid, v: wc.first, dur: dur(h1), rate: wc.firstRate }] });
    m.rows = m.rows.concat(slots(wc.first, h1 * 2, 30, 0, 0, ["bs.give", { fluid: fluid }]));
    m.rows.push({ type: "head", text: ["bs.ph.c2", { fluid: fluid, v: wc.rest, dur: dur(h2), rate: wc.restRate }] });
    m.rows = m.rows.concat(slots(wc.rest, h2 * 2, 30, h1 * 60, wc.first, ["bs.give", { fluid: fluid }]));
    m.rows.push({ type: "task", when: "", text: ["bs.c.ors", { v: ors.v }] });
    m.rows.push({ type: "check", when: hm((h1 + h2) * 60), text: ["bs.chk.c", {}] });
    return m;
  }

  // ── SAM: the protocol's own orders + a monitoring grid ────────────────
  function sam(o) {
    var P = SAM.plan(o.inst.samProtocol, o.samCtx);
    var m = { kind: "sam", protocol: P.protocol, fluid: P.fluid, vitals: ["weight", "pulse", "rr", "urine"],
      orders: [], rows: [], stop: { h: "sam.overload.h", items: [] },
      loss: { perStool: null, perEmesis: null }, zinc: null };

    P.blocks.forEach(function (b) {
      if (b.tone === "info") return;               // assessment guidance stays on screen
      var items = [];
      b.items.forEach(function (it) {
        (STOP_KEYS.indexOf(it[0]) >= 0 ? m.stop.items : items).push(it);
      });
      if (items.length) m.orders.push({ h: [b.h, b.hv], items: items });
    });

    m.rows.push({ type: "task", when: hm(0), text: ["bs.row.base.sam", {}] });
    // WHO and India oral/NG schedules: 5 mL/kg every 30 min for 2 h, then 5–10 mL/kg
    // in alternate hours (with F-75 / starter diet) up to 10 h
    var d = findItem(P, "sam.who.oral.1") || findItem(P, "sam.ind.oral.1");
    var r = findItem(P, "sam.who.oral.2") || findItem(P, "sam.ind.oral.2");
    if (d && r && !o.samCtx.cholera) {
      var fl = { key: "sam.fluid." + P.fluid };
      for (var i = 0; i < 4; i++) {
        m.rows.push({ type: "dose", when: hm(i * 30), text: ["bs.give", { fluid: fl }], v: d.d5, cum: d.d5 * (i + 1) });
      }
      for (var h = 2; h < 10; h++) {
        m.rows.push({ type: "dose", when: span(h * 60, (h + 1) * 60), text: ["bs.sam.alt", { fluid: fl, lo: r.lo, hi: r.hi }] });
      }
      m.rows.push({ type: "check", when: hm(600),
        text: findItem(P, "sam.who.oral.3") ? ["sam.who.oral.3", {}] : ["bs.chk.sam", {}] });
    } else {
      for (var k = 0; k < 12; k++) m.rows.push({ type: "blank", when: "" });
    }
    return m;
  }

  function build(o) { return o.samCtx ? sam(o) : standard(o); }

  // ════════════════════════════════════════════════════════════════════
  // Rendering (browser only). head = { logo, inst, dept, age, weight,
  //   classLabel, samLabel, protocolLabel, footer }
  function render(M, head, t) {
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    // {key, short: true} → the label without its "(…)" note, e.g. "Ringer's lactate"
    function tx(pair) {
      var src = pair[1] || {}, vars = {};
      Object.keys(src).forEach(function (k) {
        var v = src[k];
        vars[k] = (v && typeof v === "object" && v.short) ? t(v.key).replace(/\s*[(（].*$/, "") : v;
      });
      return t(pair[0], vars);
    }
    function field(label, value, wide) {
      var f = el("div", "bs-f" + (wide ? " wide" : ""));
      f.appendChild(el("span", "bs-fl", label));
      f.appendChild(el("span", "bs-fv" + (value ? "" : " blank"), value || ""));
      return f;
    }
    function section(cls, h) {
      var s = el("section", "bs-sec " + cls);
      if (h) s.appendChild(el("h3", "bs-h", h));
      return s;
    }
    var vol = function (v) { return t("bs.ml", { v: v }); };

    var root = el("div", "bs");

    // header: logo · facility · title
    var top = el("header", "bs-top");
    if (head.logo) {
      var img = el("img", "bs-logo"); img.src = head.logo; img.alt = "";
      top.appendChild(img);
    }
    var ib = el("div", "bs-inst");
    ib.appendChild(el("div", "bs-inst-n" + (head.inst ? "" : " blank"), head.inst || t("bs.f.inst")));
    if (head.dept) ib.appendChild(el("div", "bs-inst-d", head.dept));
    top.appendChild(ib);
    top.appendChild(el("div", "bs-title", t("bs.title")));
    root.appendChild(top);

    // patient box (the name is handwritten — never entered in the app)
    var pt = el("div", "bs-pt");
    [
      [t("bs.f.name"), "", true], [t("bs.f.bed"), ""], [t("bs.f.date"), ""],
      [t("bs.f.age"), head.age], [t("bs.f.weight"), head.weight], [t("bs.f.t0"), ""],
      [t("bs.f.class"), head.classLabel, true], [t("bs.f.sam"), head.samLabel],
      [t("bs.f.protocol"), head.protocolLabel, true],
      [t("bs.f.prescriber"), "", true], [t("bs.f.sign"), ""]
    ].forEach(function (f) { pt.appendChild(field(f[0], f[1], f[2])); });
    root.appendChild(pt);

    // stop signs — boxed, near the top
    if (M.stop.items.length) {
      var st = section("bs-stop", "⚠\uFE0E " + t(M.stop.h));
      var su = el("ul");
      M.stop.items.forEach(function (it) { su.appendChild(el("li", null, tx(it))); });
      st.appendChild(su);
      root.appendChild(st);
    }

    // orders
    if (M.orders.length) {
      var od = section("bs-orders", t("bs.orders.h"));
      M.orders.forEach(function (g) {
        if (g.h) od.appendChild(el("h4", "bs-oh", tx(g.h)));
        var ul = el("ul");
        g.items.forEach(function (it) { ul.appendChild(el("li", null, tx(it))); });
        od.appendChild(ul);
      });
      root.appendChild(od);
    }

    // schedule table
    if (M.rows.length) {
      var tl = section("bs-tl", t("bs.tl.h"));
      tl.appendChild(el("p", "bs-note", t("bs.tl.note")));
      var tbl = el("table", "bs-table");
      var cols = ["when", "give", "time", "amount"].concat(M.vitals, ["init"]);
      var thead = el("thead"), hr = el("tr");
      cols.forEach(function (c) { hr.appendChild(el("th", "c-" + c, t("bs.col." + c))); });
      thead.appendChild(hr); tbl.appendChild(thead);
      var tb = el("tbody");
      M.rows.forEach(function (r) {
        var tr = el("tr", "r-" + r.type);
        if (r.type === "head") {
          var th = el("td", null, tx(r.text)); th.colSpan = cols.length; tr.appendChild(th);
          tb.appendChild(tr); return;
        }
        if (r.type === "opt") {
          var od2 = el("td", null, "○  " + tx(r.text)); od2.colSpan = cols.length; tr.appendChild(od2);
          tb.appendChild(tr); return;
        }
        tr.appendChild(el("td", "c-when", r.when || ""));
        var give = el("td", "c-give");
        if (r.text) give.appendChild(document.createTextNode(tx(r.text)));
        if (r.v != null) {
          give.appendChild(document.createTextNode(" "));
          give.appendChild(el("strong", "bs-vol", (r.approx ? "≈ " : "") + vol(r.v)));
          if (r.cum != null) give.appendChild(el("span", "bs-cum", t("bs.cum", { c: r.cum })));
        }
        if (r.ifNeeded) give.appendChild(el("span", "bs-ifn", t("bs.ifNeeded")));
        tr.appendChild(give);
        tr.appendChild(el("td", "c-time"));
        tr.appendChild(el("td", "c-amount"));
        M.vitals.forEach(function (v) { tr.appendChild(el("td", "c-" + v)); });
        tr.appendChild(el("td", "c-init"));
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      tl.appendChild(tbl);
      root.appendChild(tl);
    }

    // stools / vomiting tally + zinc, side by side
    var pair = el("div", "bs-pair");
    var ls = section("bs-loss", t("bs.loss.h"));
    if (M.loss.perStool != null) {
      ls.appendChild(el("p", "bs-rule", t("bs.loss.rule", { s: M.loss.perStool, e: M.loss.perEmesis })));
    }
    var lt = el("table", "bs-table bs-ltable"), lh = el("tr");
    ["time", "sv", "given", "init"].forEach(function (c) { lh.appendChild(el("th", "c-l" + c, t("bs.lcol." + c))); });
    var lth = el("thead"); lth.appendChild(lh); lt.appendChild(lth);
    var ltb = el("tbody");
    for (var i = 0; i < 8; i++) {
      var lr = el("tr");
      lr.appendChild(el("td")); lr.appendChild(el("td", "c-lsv", t("bs.lsv")));
      lr.appendChild(el("td")); lr.appendChild(el("td"));
      ltb.appendChild(lr);
    }
    lt.appendChild(ltb); ls.appendChild(lt);
    pair.appendChild(ls);

    if (M.zinc) {
      var zn = section("bs-zinc", t("bs.zinc.h"));
      zn.appendChild(el("p", "bs-rule", t("bs.zinc.dose", { mg: String(M.zinc.mg) })));
      zn.appendChild(el("p", "bs-note", t("bs.zinc.band")));
      var zg = el("div", "bs-zgrid");
      for (var d = 1; d <= 14; d++) {
        var c = el("div", "bs-zday" + (d > 10 ? " zopt" : ""));
        c.appendChild(el("span", "bs-zd", t("bs.zinc.day", { n: String(d) })));
        c.appendChild(el("span", "bs-zl", t("bs.zinc.dateInit")));
        zg.appendChild(c);
      }
      zn.appendChild(zg);
      pair.appendChild(zn);
    }
    root.appendChild(pair);

    // plan changed
    var ch = section("bs-change", t("bs.change.h"));
    var ct = el("table", "bs-table"), chr = el("tr");
    ["when", "plan", "why", "sign"].forEach(function (c) { chr.appendChild(el("th", "c-ch" + c, t("bs.ccol." + c))); });
    var cth = el("thead"); cth.appendChild(chr); ct.appendChild(cth);
    var ctb = el("tbody");
    for (var j = 0; j < 2; j++) {
      var cr = el("tr");
      cr.appendChild(el("td"));
      cr.appendChild(el("td", "c-chplan", t("bs.ccol.planOpts")));
      cr.appendChild(el("td")); cr.appendChild(el("td"));
      ctb.appendChild(cr);
    }
    ct.appendChild(ctb); ch.appendChild(ct);
    root.appendChild(ch);

    root.appendChild(el("footer", "bs-foot", head.footer));
    return root;
  }

  root.RH_SHEET = { build: build, render: render, hm: hm };
  if (typeof module !== "undefined" && module.exports) module.exports = root.RH_SHEET;
})(typeof window !== "undefined" ? window : globalThis);
