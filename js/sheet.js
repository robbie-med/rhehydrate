/* PRhehydrate — bedside sheet. build() turns a plan into checklist rows
 * (volumes from calc.js / sam.js only); render() draws them for screen and print. */
(function (root) {
  "use strict";
  var C = root.RH_CALC, SAM = root.RH_SAM;

  // shown in the stop box instead of the orders
  var STOP_KEYS = ["sam.who.oral.5", "sam.who.shock.5", "sam.msf.overload", "sam.msf.b.4",
    "sam.acf.stop", "sam.ind.oral.4", "sam.ind.shock.5"];
  var RED_FLAGS = [["rf.1", {}], ["rf.2", {}], ["rf.3", {}], ["rf.4", {}], ["rf.5", {}]];

  // minutes → "h:mm"
  function hm(min) {
    var h = Math.floor(min / 60), m = Math.round(min - h * 60);
    return h + ":" + (m < 10 ? "0" : "") + m;
  }
  function span(a, b) { return hm(a) + "–" + hm(b); }

  // `total` mL split evenly over `n` slots of `step` minutes from `t0`
  function slots(total, n, step, t0, cum0, text) {
    var rows = [], per = total / n;
    for (var i = 0; i < n; i++) {
      rows.push({ type: "dose", when: span(t0 + i * step, t0 + (i + 1) * step), text: text,
        v: per, cum: cum0 + per * (i + 1), approx: true });
    }
    return rows;
  }
  function dur(hours) {
    return hours < 1 ? { key: "bs.dur.min", vars: { n: Math.round(hours * 60) } } : { key: "bs.dur.h", vars: { n: hours } };
  }

  function findItem(P, key) {
    for (var i = 0; i < P.blocks.length; i++)
      for (var j = 0; j < P.blocks[i].items.length; j++)
        if (P.blocks[i].items[j][0] === key) return P.blocks[i].items[j][1];
    return null;
  }

  function standard(o) {
    var w = o.w, ins = o.inst, fluid = { key: "inst.ivFluid." + ins.ivFluid, short: true };
    var loss = C.ongoingLosses(0, 0, w);
    var naKey = o.na ? o.na.key : null;
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
      if (naKey === "hyper") items.push(["plan.na.hyper.1", {}], ["plan.na.hyper.2", { fluid: fluid }]);
      if (naKey === "hypo")  m.stop.items = RED_FLAGS.concat([["bs.hypo", {}]]);
      m.orders.push({ h: null, items: items });
      m.rows.push({ type: "head", text: ["plan.b.dose", { vol: b.vol, hours: String(ins.planBHours), rate: String(ins.planBRate), perHour: b.perHour }] });
      m.rows = m.rows.concat(slots(b.vol, ins.planBHours, 60, 0, 0, ["bs.give", { fluid: { key: "bs.ors" } }]));
      m.rows.push({ type: "check", when: hm(ins.planBHours * 60), text: ["bs.chk.b", {}] });
      return m;
    }

    m.vitals = ["pulse", "rr", "urine"];
    m.loss = { perStool: null, perEmesis: null };
    var ors = C.perKg("w.ors", 5, "mL/kg/h", w, "mL/h");
    m.rows.push({ type: "task", when: hm(0), text: ["bs.row.base", {}] });
    m.rows.push({ type: "task", when: "", text: o.na ? ["bs.row.labs.na", { na: o.na.na }] : ["bs.row.labs", {}] });
    m.rows.push({ type: "task", when: "", text: ["bs.access", {}] });
    if (naKey === "hypo") m.stop.items = RED_FLAGS.concat([["bs.hypo", {}]]);
    // fallback when neither IV nor IO is possible: NG ORS 20 mL/kg/h × 6 h
    var ng = C.planCNg(w);
    function ngRows() {
      m.rows.push({ type: "head", text: ["bs.ng.h", { rate: ng.rate, total: ng.total }] });
      m.rows = m.rows.concat(slots(ng.total, 6, 60, 0, 0, ["bs.give", { fluid: { key: "bs.ors" } }]));
      m.rows.push({ type: "check", when: hm(360), text: ["bs.chk.ng", {}] });
      return m;
    }

    // hypernatraemia: boluses only for shock, then 48 h at a steady rate with Na⁺ every 4 h
    if (naKey === "hyper") {
      var pch = C.planCBolus(w, o.deficitVol, o.maintHr, 1);
      m.orders.push({ h: null, items: [["plan.na.hyper.1", {}], ["plan.na.hyper.2", { fluid: fluid }], ["plan.na.hyper.3", {}]] });
      [1, 2, 3].forEach(function (k) {
        m.rows.push({ type: "task", when: k === 1 ? hm(0) : "",
          text: [k === 1 ? "bs.bolus.1" : "bs.bolus.n", { n: String(k), fluid: fluid }], v: pch.bolus, ifNeeded: true });
        m.rows.push({ type: "check", when: "", text: ["bs.chk.perf", {}], vit: true });
      });
      var s1 = C.slowRehydration(pch.remaining, o.maintHr);
      m.rows.push({ type: "head", text: ["bs.p48.h", { fluid: fluid, rate: s1.rate }] });
      [0, 1, 2, 3].forEach(function (k) {
        var s = C.slowRehydration(C.planCBolus(w, o.deficitVol, o.maintHr, k).remaining, o.maintHr);
        m.rows.push({ type: "opt", text: ["bs.p48.opt", { n: String(k), rate: s.rate, total: s.total }] });
      });
      for (var q = 1; q <= 12; q++) {
        m.rows.push({ type: "dose", when: ["bs.p2.when", { t: hm(q * 240) }], text: ["bs.p48.row", { fluid: fluid }] });
      }
      m.rows.push({ type: "task", when: "", text: ["bs.oral.started", {}] });
      return ngRows();
    }

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
        m.rows.push({ type: "dose", when: ["bs.p2.when", { t: hm(i * 120) }], text: ["bs.p2.row", {}] });
      }
      m.rows.push({ type: "task", when: "", text: ["bs.oral.started", {}] });
      return ngRows();
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
    return ngRows();
  }

  function sam(o) {
    var P = SAM.plan(o.inst.samProtocol, o.samCtx);
    var m = { kind: "sam", protocol: P.protocol, fluid: P.fluid, vitals: ["weight", "pulse", "rr", "urine"],
      orders: [], rows: [], stop: { h: "sam.overload.h", items: [] },
      loss: { perStool: null, perEmesis: null }, zinc: null };

    P.blocks.forEach(function (b) {
      if (b.tone === "info") return;
      var items = [];
      b.items.forEach(function (it) {
        (STOP_KEYS.indexOf(it[0]) >= 0 ? m.stop.items : items).push(it);
      });
      if (items.length) m.orders.push({ h: [b.h, b.hv], items: items });
    });

    m.rows.push({ type: "task", when: hm(0), text: ["bs.row.base.sam", {}] });
    // WHO / India oral: 4 doses q30 min, then hourly to 10 h
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

  // head = { logo, inst, dept, age, weight, classLabel, samLabel, protocolLabel, footer }
  function render(M, head, t) {
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    // {key, short: true} → label without its "(…)" note
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

    // the name is handwritten, never entered
    var pt = el("div", "bs-pt");
    [
      [t("bs.f.name"), "", true], [t("bs.f.bed"), ""], [t("bs.f.date"), ""],
      [t("bs.f.age"), head.age], [t("bs.f.weight"), head.weight], [t("bs.f.t0"), ""],
      [t("bs.f.class"), head.classLabel, true], [t("bs.f.sam"), head.samLabel],
      [t("bs.f.protocol"), head.protocolLabel, true]
    ].forEach(function (f) { pt.appendChild(field(f[0], f[1], f[2])); });
    root.appendChild(pt);

    if (M.stop.items.length) {
      var st = section("bs-stop", "⚠\uFE0E " + t(M.stop.h));
      var su = el("ul");
      M.stop.items.forEach(function (it) { su.appendChild(el("li", null, tx(it))); });
      st.appendChild(su);
      root.appendChild(st);
    }

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
        tr.appendChild(el("td", "c-when", Array.isArray(r.when) ? tx(r.when) : (r.when || "")));
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
