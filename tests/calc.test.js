/* Run: node tests/calc.test.js
 * Checks every formula in js/calc.js and every protocol in js/sam.js against
 * hand-worked values, and that each displayed expression evaluates to the
 * number the app uses (so the "show the maths" working cannot drift). */
"use strict";
var assert = require("assert");
var C = require("../js/calc.js");
var S = require("../js/sam.js");

var passed = 0;
function t(name, fn) { fn(); passed++; console.log("ok  " + name); }
function close(a, b) { assert.ok(Math.abs(a - b) < 1e-9, a + " ≠ " + b); }

// Evaluate a working expression like "(10 × 100) + (12 − 10) × 50"
function evalExpr(x) {
  var js = x.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/mL\/kg\/h|mL\/kg|mg\/kg|kg|mL|%/g, "").replace(/max\(/g, "Math.max(");
  return Function("return (" + js + ");")();
}
function checkWork(work) {
  work.forEach(function (l) {
    if (typeof l.v !== "number" || /[<≥]|→|,|weight|months/.test(l.x)) return;
    // expressions show operands rounded to 2 dp; allow that rounding (≤ 0.1%)
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

console.log("\n" + passed + " tests passed");
