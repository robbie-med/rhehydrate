/* node tests/calc.test.js */
"use strict";
var assert = require("assert");
var C = require("../js/calc.js");
var S = require("../js/sam.js");

var LANGS = ["en", "kr", "fr", "ru", "zh"];
var passed = 0;
function t(name, fn) { fn(); passed++; console.log("ok  " + name); }
function close(a, b) { assert.ok(Math.abs(a - b) < 1e-9, a + " ≠ " + b); }

// evaluate e.g. "(10 × 100) + (12 − 10) × 50"
function evalExpr(x) {
  var js = x.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/mL\/kg\/h|mL\/kg|mg\/kg|kg|mL|%/g, "").replace(/max\(/g, "Math.max(");
  return Function("return (" + js + ");")();
}
function checkWork(work) {
  work.forEach(function (l) {
    if (typeof l.v !== "number" || /[<≥]|→|,|weight|months/.test(l.x)) return;
    // operands are shown to 2 dp
    var e = evalExpr(l.x);
    assert.ok(Math.abs(e - l.v) <= Math.max(0.05, Math.abs(l.v) * 0.001), l.k + ": " + l.x + " = " + e + " ≠ " + l.v);
  });
}

t("Holliday–Segar 8 kg", function () { var m = C.maintenance(8); close(m.daily, 800); close(m.hourly, 800 / 24); checkWork(m.work); });
t("Holliday–Segar 12 kg", function () { var m = C.maintenance(12); close(m.daily, 1100); checkWork(m.work); });
t("Holliday–Segar 25 kg", function () { var m = C.maintenance(25); close(m.daily, 1600); checkWork(m.work); });
t("deficit volume 6% × 12 kg", function () { var d = C.deficitVolume(6, 12); close(d.v, 720); checkWork(d.work); });
t("weight-loss %", function () { var d = C.deficitFromWeightLoss(10, 9.3); close(d.pct, 7); checkWork(d.work); });
t("weight-loss % capped at 15", function () { var d = C.deficitFromWeightLoss(10, 8); close(d.pct, 15); close(d.raw, 20); });
t("ongoing losses", function () { var l = C.ongoingLosses(3, 2, 12); close(l.v, 3 * 120 + 2 * 24); checkWork(l.work); });
t("Plan B 75 mL/kg over 4 h", function () { var b = C.planB(12, 75, 4); close(b.vol, 900); close(b.perHour, 225); checkWork(b.work); });
t("Plan C WHO child", function () { var c = C.planCWho(12, 24); close(c.first, 360); close(c.rest, 840); close(c.firstRate, 720); close(c.restRate, 336); checkWork(c.work); });
t("Plan C WHO infant", function () { var c = C.planCWho(7, 8); close(c.firstRate, 210); close(c.restRate, 98); checkWork(c.work); });
t("Plan C WHO age unknown shows both bands", function () { assert.strictEqual(C.planCWho(10, null).work.length, 7); });
t("Plan C bolus — 1 bolus given", function () {
  var c = C.planCBolus(12, 1200, 1100 / 24, 1);
  close(c.given, 240); close(c.remaining, 960); close(c.maint12, 550); close(c.rate, (960 + 550) / 12); checkWork(c.work);
});
t("Plan C bolus — 3 boluses given", function () { var c = C.planCBolus(12, 1200, 1100 / 24, 3); close(c.given, 720); close(c.remaining, 480); });
t("Plan C bolus — remaining never negative", function () { close(C.planCBolus(10, 500, 1000 / 24, 3).remaining, 0); });
t("Plan C NG fallback: 20 mL/kg/h × 6 h", function () { var g = C.planCNg(10); close(g.rate, 200); close(g.total, 1200); checkWork(g.work); });
t("sodium bands", function () {
  assert.strictEqual(C.sodiumBand(128).key, "hypo"); assert.strictEqual(C.sodiumBand(140).key, "iso");
  assert.strictEqual(C.sodiumBand(151).key, "hyper"); assert.strictEqual(C.sodiumBand(null), null);
});
t("hypernatraemia: deficit + maintenance over 48 h", function () {
  var s = C.slowRehydration(1200, 1100 / 24); close(s.maint48, 2200); close(s.total, 3400); close(s.rate, 3400 / 48); checkWork(s.work);
});
t("hypoglycaemia bolus 5 mL/kg of 10% glucose", function () { var g = C.glucoseBolus(12); close(g.v, 60); checkWork(g.work); });
t("CDS bands", function () {
  assert.strictEqual(C.cdsSeverity({ appearance: 0, eyes: 0, mucous: 0, tears: 0 }).key, "none");
  assert.strictEqual(C.cdsSeverity({ appearance: 1, eyes: 1, mucous: 1, tears: 1 }).key, "some");
  assert.strictEqual(C.cdsSeverity({ appearance: 2, eyes: 1, mucous: 1, tears: 1 }).key, "severe");
  assert.strictEqual(C.cdsSeverity({ appearance: 2, eyes: null, mucous: 1, tears: 1 }), null);
});
t("WHO signs rule", function () {
  assert.strictEqual(C.whoSeverity({ condition: 2, eyes: 2, thirst: 1, skin: 0 }).key, "severe");
  assert.strictEqual(C.whoSeverity({ condition: 2, eyes: 1, thirst: 0, skin: 0 }).key, "some");
  assert.strictEqual(C.whoSeverity({ condition: 1, eyes: 0, thirst: 0, skin: 0 }).key, "none");
});
t("SAM screen — MUAC", function () {
  assert.strictEqual(C.samScreen({ muac: 110, oedema: 0, whz: null, months: 18 }).status, "pos");
  assert.strictEqual(C.samScreen({ muac: 120, oedema: 0, whz: null, months: 18 }).status, "neg");
  assert.ok(C.samScreen({ muac: 120, oedema: 0, whz: null, months: 18 }).notes.indexOf("sam.note.moderate") >= 0);
});
t("SAM screen — MUAC ignored outside 6–59 months", function () {
  assert.strictEqual(C.samScreen({ muac: 100, oedema: 0, whz: null, months: 3 }).status, "incomplete");
  assert.strictEqual(C.samScreen({ muac: 100, oedema: 0, whz: "no", months: 72 }).status, "neg");
});
t("SAM screen — oedema / WHZ", function () {
  assert.strictEqual(C.samScreen({ muac: null, oedema: 1, whz: null, months: 18 }).status, "pos");
  assert.strictEqual(C.samScreen({ muac: null, oedema: 0, whz: "yes", months: 18 }).status, "pos");
  assert.strictEqual(C.samScreen({ muac: null, oedema: null, whz: null, months: 18 }).status, "incomplete");
});

// ── protocols ──
function base(extra) {
  var c = { w: 8, months: 18, hyd: "some", shock: false, cholera: false, oralOk: true, preW: null, oedema: 0, fluid: "auto" };
  for (var k in extra) c[k] = extra[k];
  return c;
}
function allWork(p) { return p.blocks.reduce(function (a, b) { return a.concat(b.work); }, []); }
function find(p, key) {
  for (var i = 0; i < p.blocks.length; i++) for (var j = 0; j < p.blocks[i].items.length; j++)
    if (p.blocks[i].items[j][0] === key) return p.blocks[i].items[j][1];
  return null;
}

t("every protocol builds every scenario with consistent working", function () {
  S.ORDER.forEach(function (id) {
    ["none", "some", "severe"].forEach(function (hyd) {
      [false, true].forEach(function (shock) {
        [true, false].forEach(function (oralOk) {
          [false, true].forEach(function (chol) {
            var p = S.plan(id, base({ hyd: hyd, shock: shock, oralOk: oralOk, cholera: chol }));
            assert.ok(p.blocks.length > 0, id + " " + hyd);
            checkWork(allWork(p));
          });
        });
      });
    });
  });
});
t("WHO oral: 5 mL/kg q30min ×4, then 5–10 mL/kg/h", function () {
  var v = find(S.plan("who", base()), "sam.who.oral.1"); close(v.d5, 40); close(v.t2, 160);
  var r = find(S.plan("who", base()), "sam.who.oral.2"); close(r.lo, 40); close(r.hi, 80);
});
t("WHO shock: 15 mL/kg over 1 h, 4 mL/kg/h, blood 10 mL/kg", function () {
  var p = S.plan("who", base({ shock: true }));
  close(find(p, "sam.who.shock.1").v, 120); close(find(p, "sam.who.shock.4").m4, 32); close(find(p, "sam.who.shock.4").b10, 80);
});
t("WHO fluid defaults to ReSoMal; India to ORS+KCl", function () {
  assert.strictEqual(S.plan("who", base()).fluid, "resomal");
  assert.strictEqual(S.plan("india", base()).fluid, "orsK");
  assert.strictEqual(S.plan("who", base({ fluid: "ors" })).fluid, "ors");
});
t("MSF Plan B: 20 mL/kg/h × 2 h, target ×1.06", function () {
  var p = S.plan("msf", base());
  close(find(p, "sam.msf.b.1").r20, 160); close(find(p, "sam.msf.b.1").t40, 320); close(find(p, "sam.msf.target").tw, 8.48);
});
t("MSF Plan C: target ×1.1; pre-illness weight wins when higher", function () {
  close(find(S.plan("msf", base({ hyd: "severe" })), "sam.msf.target").tw, 8.8);
  close(find(S.plan("msf", base({ hyd: "severe", preW: 9 })), "sam.msf.target").tw, 9);
});
t("MSF shock: ceftriaxone 80 mg/kg, G5%-RL 10 mL/kg/h", function () {
  var p = S.plan("msf", base({ shock: true }));
  close(find(p, "sam.msf.shock.1").cef, 640); close(find(p, "sam.msf.shock.2").r10, 80);
});
t("ACF: oedema → no rehydration plan", function () {
  var p = S.plan("acf", base({ oedema: 2 }));
  assert.ok(find(p, "sam.acf.oedema")); assert.strictEqual(find(p, "sam.acf.oral.1"), null);
});
t("ACF: 10 mL/kg/h, target max +5%", function () {
  var p = S.plan("acf", base()); close(find(p, "sam.acf.oral.1").r10, 80); close(find(p, "sam.acf.target.est").tw, 8.4);
});
t("ACF: no weight loss vs pre-illness weight → not dehydrated", function () {
  assert.ok(find(S.plan("acf", base({ preW: 7.8 })), "sam.acf.noloss"));
});
t("India: per-stool volume by age", function () {
  close(find(S.plan("india", base({ hyd: "none", months: 12 })), "sam.ind.prev.age").ml, 50);
  close(find(S.plan("india", base({ hyd: "none", months: 30 })), "sam.ind.prev.age").ml, 100);
});
t("Kenya shock: 20 mL/kg over 2 h; then 10 → 7.5 mL/kg/h", function () {
  var p = S.plan("kenya", base({ shock: true }));
  close(find(p, "sam.ken.shock.1").v20, 160); close(find(p, "sam.ken.shock.1").r, 80);
  close(find(p, "sam.ken.oral.2").r75, 60);
});
t("Cholera overrides protocol: 20 mL/kg + 70 mL/kg over 6 h", function () {
  var p = S.plan("who", base({ hyd: "severe", cholera: true }));
  close(find(p, "sam.chol.c.1").b, 160); close(find(p, "sam.chol.c.2").c, 560); close(find(p, "sam.chol.c.2").r, 560 / 6);
  close(find(S.plan("acf", base({ cholera: true })), "sam.chol.b").v, 600);
});

// ── bedside sheet ──
var SH = require("../js/sheet.js");
var INST = { planBRate: 75, planBHours: 4, planCAppr: "who", ivFluid: "rl", showZinc: true,
  showOnda: true, showNgOrs: true, samProtocol: "who", samFluid: "auto" };
function inst(extra) { var o = {}, k; for (k in INST) o[k] = INST[k]; for (k in extra) o[k] = extra[k]; return o; }
function doses(m) { return m.rows.filter(function (r) { return r.type === "dose" && r.v != null; }); }
function sum(rows) { return rows.reduce(function (a, r) { return a + r.v; }, 0); }

t("zinc: 10 mg under 6 months, 20 mg from 6 months", function () {
  assert.strictEqual(C.zinc(5).mg, 10); assert.strictEqual(C.zinc(5.9).mg, 10);
  assert.strictEqual(C.zinc(6).mg, 20); assert.strictEqual(C.zinc(36).mg, 20);
});
t("sheet Plan B: hourly slots add up to the ORS volume", function () {
  [3, 4, 6].forEach(function (h) {
    var m = SH.build({ w: 8, months: 9, sev: "some", inst: inst({ planBHours: h }) });
    var d = doses(m);
    assert.strictEqual(d.length, h); close(sum(d), 600); close(d[d.length - 1].cum, 600);
    assert.strictEqual(m.rows[m.rows.length - 1].when, SH.hm(h * 60));
    assert.strictEqual(m.zinc.mg, 20); close(m.loss.perStool, 80); close(m.loss.perEmesis, 16);
  });
});
// rows before the NG fallback block
function ivPart(m) {
  var i = m.rows.map(function (r) { return r.text && r.text[0]; }).indexOf("bs.ng.h");
  return i < 0 ? m : { rows: m.rows.slice(0, i) };
}
t("sheet Plan C WHO: infant 1 h + 5 h, child 30 min + 2.5 h, total 100 mL/kg", function () {
  var inf = doses(ivPart(SH.build({ w: 8, months: 9, sev: "severe", inst: inst() })));
  assert.strictEqual(inf.length, 12); close(sum(inf), 800);
  close(inf[0].v + inf[1].v, 240); close(inf[11].cum, 800); assert.strictEqual(inf[11].when, "5:30–6:00");
  var ch = doses(ivPart(SH.build({ w: 10, months: 18, sev: "severe", inst: inst() })));
  assert.strictEqual(ch.length, 6); close(ch[0].v, 300); close(sum(ch), 1000); assert.strictEqual(ch[5].when, "2:30–3:00");
});
t("sheet Plan C bolus: phase-2 options match planCBolus for 1–3 boluses", function () {
  var m = SH.build({ w: 12, months: 24, sev: "severe", deficitVol: 1200, maintHr: 1100 / 24, inst: inst({ planCAppr: "bolus" }) });
  var opts = m.rows.filter(function (r) { return r.type === "opt"; });
  assert.strictEqual(opts.length, 3);
  opts.forEach(function (o, i) { close(o.text[1].rate, C.planCBolus(12, 1200, 1100 / 24, i + 1).rate); });
  m.rows.filter(function (r) { return r.text && /^bs\.bolus/.test(r.text[0]); }).forEach(function (r) { close(r.v, 240); });
});
t("sheet severe: access row and six NG fallback rows in every variant", function () {
  ["who", "bolus"].forEach(function (ap) {
    [null, C.sodiumBand(160)].forEach(function (na) {
      var m = SH.build({ w: 10, months: 18, sev: "severe", deficitVol: 1000, maintHr: 1000 / 24, inst: inst({ planCAppr: ap }), na: na });
      assert.ok(m.rows.some(function (r) { return r.text && r.text[0] === "bs.access"; }));
      var i = m.rows.map(function (r) { return r.text && r.text[0]; }).indexOf("bs.ng.h");
      assert.ok(i > 0, ap + " NG head");
      var doses = m.rows.slice(i + 1, i + 7);
      assert.strictEqual(doses.filter(function (r) { return r.type === "dose"; }).length, 6);
      close(doses.reduce(function (s, r) { return s + r.v; }, 0), 1200);
    });
  });
});
t("sheet hypernatraemia: 48 h rows, options for 0–3 boluses, labs row carries Na⁺", function () {
  var na = C.sodiumBand(158);
  var m = SH.build({ w: 10, months: 18, sev: "severe", deficitVol: 1000, maintHr: 1000 / 24, inst: inst({ planCAppr: "who" }), na: na });
  var rows = m.rows.filter(function (r) { return r.text && r.text[0] === "bs.p48.row"; });
  assert.strictEqual(rows.length, 12);
  var opts = m.rows.filter(function (r) { return r.type === "opt"; });
  assert.strictEqual(opts.length, 4);
  close(opts[0].text[1].rate, (1000 + 1000 / 24 * 48) / 48);
  assert.ok(m.rows.some(function (r) { return r.text && r.text[0] === "bs.row.labs.na" && r.text[1].na === 158; }));
  var hypo = SH.build({ w: 10, months: 18, sev: "some", deficitVol: 600, maintHr: 1000 / 24, inst: inst({}), na: C.sodiumBand(125) });
  assert.ok(hypo.stop.items.some(function (i) { return i[0] === "bs.hypo"; }));
});
t("sheet zinc follows the setting and age; none in SAM", function () {
  assert.strictEqual(SH.build({ w: 6, months: 4, sev: "some", inst: inst() }).zinc.mg, 10);
  assert.strictEqual(SH.build({ w: 6, months: 4, sev: "some", inst: inst({ showZinc: false }) }).zinc, null);
  assert.strictEqual(SH.build({ w: 8, months: 18, inst: inst(), samCtx: base() }).zinc, null);
});
t("sheet SAM WHO oral: 4 doses of 5 mL/kg every 30 min, then hourly rows to 10 h; stop signs boxed", function () {
  var m = SH.build({ w: 8, months: 18, inst: inst(), samCtx: base() });
  var d = doses(m);
  assert.strictEqual(d.length, 4); d.forEach(function (r) { close(r.v, 40); }); close(d[3].cum, 160);
  assert.deepStrictEqual(d.map(function (r) { return r.when; }), ["0:00", "0:30", "1:00", "1:30"]);
  var alt = m.rows.filter(function (r) { return r.text && r.text[0] === "bs.sam.alt"; });
  assert.strictEqual(alt.length, 8); close(alt[0].text[1].lo, 40); close(alt[0].text[1].hi, 80);
  assert.ok(m.stop.items.some(function (i) { return i[0] === "sam.who.oral.5"; }));
  m.orders.forEach(function (g) { g.items.forEach(function (i) { assert.notStrictEqual(i[0], "sam.who.oral.5"); }); });
});
t("sheet SAM: India uses its own doses; other protocols, shock and cholera get a blank grid", function () {
  var ind = doses(SH.build({ w: 8, months: 18, inst: inst({ samProtocol: "india" }), samCtx: base() }));
  assert.strictEqual(ind.length, 4); close(ind[0].v, 40);
  [["msf", {}], ["acf", {}], ["kenya", {}], ["who", { shock: true }], ["who", { cholera: true }]].forEach(function (c) {
    var m = SH.build({ w: 8, months: 18, inst: inst({ samProtocol: c[0] }), samCtx: base(c[1]) });
    assert.strictEqual(doses(m).length, 0, c[0]);
    assert.strictEqual(m.rows.filter(function (r) { return r.type === "blank"; }).length, 12, c[0]);
  });
});
t("every string the sheet uses exists in all five languages", function () {
  global.window = globalThis;
  require("../js/i18n.js"); require("../js/i18n-sam.js"); require("../js/i18n-sheet.js");
  var I = globalThis.I18N, fs = require("fs"), path = require("path");
  var keys = {};
  function collect(m) {
    m.rows.forEach(function (r) { if (r.text) keys[r.text[0]] = 1; });
    m.orders.forEach(function (g) { if (g.h) keys[g.h[0]] = 1; g.items.forEach(function (i) { keys[i[0]] = 1; }); });
    m.stop.items.forEach(function (i) { keys[i[0]] = 1; }); keys[m.stop.h] = 1;
  }
  ["none", "some", "severe"].forEach(function (sev) {
    ["who", "bolus"].forEach(function (a) {
      collect(SH.build({ w: 8, months: 9, sev: sev, deficitVol: 800, maintHr: 800 / 24, inst: inst({ planCAppr: a }) }));
    });
  });
  S.ORDER.forEach(function (id) {
    ["none", "some", "severe"].forEach(function (hyd) {
      [false, true].forEach(function (shock) {
        collect(SH.build({ w: 8, months: 18, inst: inst({ samProtocol: id }), samCtx: base({ hyd: hyd, shock: shock }) }));
      });
    });
  });
  ["js/sheet.js", "js/app.js"].forEach(function (f) {
    var src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    (src.match(/"(bs\.[\w.]+|inst\.logo[\w.]*)"/g) || []).forEach(function (k) { keys[k.slice(1, -1)] = 1; });
  });
  ["col", "lcol", "ccol"].forEach(function (g) {
    var cols = { col: ["when", "give", "time", "amount", "weight", "pulse", "rr", "urine", "init"],
      lcol: ["time", "sv", "given", "init"], ccol: ["when", "plan", "why", "sign"] }[g];
    cols.forEach(function (c) { keys["bs." + g + "." + c] = 1; });
  });
  Object.keys(keys).forEach(function (k) {
    if (/\.$/.test(k)) return;   // prefix
    LANGS.forEach(function (l) { assert.ok(k in I[l], l + " missing " + k); });
  });
});

// ── translations ──
t("every UI string exists in every language, with the same placeholders", function () {
  var I = globalThis.I18N;
  function ph(s) { return (s.match(/\{\w+\}/g) || []).sort().join(" "); }
  Object.keys(I.en).forEach(function (k) {
    LANGS.forEach(function (l) {
      assert.ok(typeof I[l][k] === "string" && I[l][k].trim(), l + " missing " + k);
      assert.strictEqual(ph(I[l][k]), ph(I.en[k]), l + " " + k + " placeholders");
      if (k.indexOf("f:") === 0) assert.strictEqual(I[l][k].split("#").length, I.en[k].split("#").length, l + " " + k + " #");
    });
  });
  LANGS.forEach(function (l) {
    Object.keys(I[l]).forEach(function (k) { assert.ok(k in I.en, l + " has stale key " + k); });
  });
});

t("every formula and unit the working can show has a translation key", function () {
  var I = globalThis.I18N, lines = [];
  function add(w) { lines = lines.concat(w); }
  [5, 12, 25].forEach(function (w) {
    add(C.maintenance(w).work); add(C.deficitVolume(6, w).work); add(C.ongoingLosses(2, 1, w).work);
    add(C.planB(w, 75, 4).work); add(C.planCWho(w, null).work); add(C.planCBolus(w, 1000, 40, 2).work);
  });
  add(C.deficitFromWeightLoss(10, 8).work); add(C.zinc(20).work); add(C.planCNg(7).work);
  add(C.sodiumBand(155).work); add(C.slowRehydration(1000, 40).work); add(C.glucoseBolus(8).work);
  add(C.cdsSeverity({ appearance: 1, eyes: 1, mucous: 1, tears: 1 }).work);
  add(C.whoSeverity({ condition: 1, eyes: 1, thirst: 1, skin: 1 }).work);
  add(C.samScreen({ muac: 110, oedema: 2, whz: "yes", months: 20 }).work);
  S.ORDER.forEach(function (id) {
    ["none", "some", "severe"].forEach(function (hyd) {
      [false, true].forEach(function (shock) { [false, true].forEach(function (cholera) {
        [true, false].forEach(function (oralOk) { [null, 9, 7].forEach(function (preW) { [null, 10].forEach(function (months) {
          S.plan(id, base({ hyd: hyd, shock: shock, cholera: cholera, oralOk: oralOk, preW: preW, months: months })).blocks
            .forEach(function (b) { add(b.work); });
        }); }); });
      }); });
    });
  });
  var app = require("fs").readFileSync(require("path").join(__dirname, "../js/app.js"), "utf8");
  var unitRe = new RegExp(app.match(/var UNIT_RE = \/(.*)\/g;/)[1], "g");
  lines.forEach(function (l) {
    assert.ok(("f:" + l.f.replace(/\d+(?:\.\d+)?/g, "#")) in I.en, "no f: key for " + l.f);
    assert.ok(I.en["w.v." + l.v] || I.en["sev." + l.v] || typeof l.v === "number" || l.v === "—", "untranslated value " + l.v);
    (String(l.x) + " " + l.u).replace(unitRe, function (u) { assert.ok(("u." + u) in I.en, "no unit key u." + u); });
  });
});

t("every reference-table string has a translation in all five languages", function () {
  var fs = require("fs"), path = require("path"), vm = require("vm"), ctx = { window: {} };
  vm.createContext(ctx);
  ["kr", "ru", "zh"].forEach(function (l) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../js/tables-" + l + ".js"), "utf8"), ctx);
  });
  var D = { kr: ctx.window.RH_TABLES_KR, ru: ctx.window.RH_TABLES_RU, zh: ctx.window.RH_TABLES_ZH };
  var src = fs.readFileSync(path.join(__dirname, "../js/tables.js"), "utf8");
  var re = /\{\s*en:\s*("(?:[^"\\]|\\.)*")(\s*,\s*fr:\s*("(?:[^"\\]|\\.)*"))?(\s*,\s*kr:\s*"(?:[^"\\]|\\.)*")?/g, m, n = 0;
  while ((m = re.exec(src))) {
    var en = JSON.parse(m[1]);
    if (/^(🇬🇧|en)$/.test(en) || !/[A-Za-z]/.test(en)) continue;
    n++;
    assert.ok(m[3] && JSON.parse(m[3]).trim(), "fr missing: " + en);
    ["kr", "ru", "zh"].forEach(function (l) { assert.ok(m[4] && l === "kr" || D[l][en], l + " missing: " + en); });
  }
  assert.ok(n > 200, "table strings found: " + n);
});

// ── release versions ──
t("release versions agree (sw.js, app.js, ?v= in HTML) and every script is precached", function () {
  var fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
  var sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  var ver = sw.match(/var VERSION = "([\d.]+)"/)[1];
  var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8").match(/APP_VERSION = "([\d.]+)"/)[1];
  assert.strictEqual(app, ver, "APP_VERSION " + app + " ≠ sw.js VERSION " + ver);
  ["index.html", "tables.html"].forEach(function (f) {
    var html = fs.readFileSync(path.join(root, f), "utf8");
    var refs = html.match(/(?:src|href)="((?:js|css)\/[^"]+)"/g) || [];
    assert.ok(refs.length > 0, f);
    refs.forEach(function (r) {
      var u = r.replace(/^(src|href)="/, "").replace(/"$/, "");
      assert.ok(u.indexOf("?v=" + ver) > 0, f + ": " + u + " is not versioned ?v=" + ver);
      assert.ok(sw.indexOf('"./' + u.split("?")[0] + '" + V') >= 0, f + ": " + u + " missing from sw.js ASSETS");
    });
  });
});

console.log("\n" + passed + " tests passed");
