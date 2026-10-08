/* PRhehydrate — SAM rehydration protocols (excerpts: docs/SAM-PROTOCOLS.md).
 * ctx = { w, months, hyd: none|some|severe, shock, cholera, oralOk, preW, oedema, fluid } */
(function (root) {
  "use strict";
  var C = root.RH_CALC, S = C.SRC, perKg = C.perKg, line = C.line, n = C.n;

  function block(h, tone, items, work, hv) {
    return { h: h, hv: hv || {}, tone: tone || null, items: items, work: work || [] };
  }
  function fluidVar(ctx) { return { fluid: { key: "sam.fluid." + ctx.fluid } }; }
  function mix(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

  // pre-diarrhoea weight if higher than current, else current × factor
  function targetWeight(ctx, factor, src, fn) {
    if (ctx.preW && ctx.preW > ctx.w) {
      return { v: ctx.preW, basis: "sam.basis.pre",
        work: line("w.sam.target", "pre-diarrhoea weight", n(ctx.preW) + " kg", ctx.preW, "kg", src, fn) };
    }
    var v = ctx.w * factor;
    return { v: v, basis: "sam.basis.est" + Math.round(factor * 100),
      work: line("w.sam.target", "current weight × " + factor, n(ctx.w) + " kg × " + factor, v, "kg", src, fn) };
  }

  // ── cholera / profuse watery diarrhoea (MSF Cholera guideline §5.8) ──
  function cholera(ctx) {
    var w = ctx.w, src = S.msfCholera, fn = "cholera";
    var out = [block("sam.chol.h", "warn", [["sam.chol.note", {}]])];
    if (ctx.hyd === "none" && !ctx.shock) {
      out.push(block("sam.chol.a.h", null, [["sam.chol.a", {}]]));
    } else if (ctx.hyd === "some" && !ctx.shock) {
      var v75 = perKg("w.sam.total", 75, "mL/kg", w, "mL", src, fn);
      var r = line("w.sam.rate", "total ÷ 4 h", n(v75.v) + " ÷ 4", v75.v / 4, "mL/h", src, fn);
      out.push(block("sam.chol.b.h", null, [["sam.chol.b", { v: v75.v, r: r.v }]], [v75, r]));
    } else {
      var b = perKg("w.sam.bolus", 20, "mL/kg", w, "mL", src, fn);
      var c = perKg("w.sam.total", 70, "mL/kg", w, "mL", src, fn);
      var rc = line("w.sam.rate", "70 mL/kg ÷ 6 h", n(c.v) + " ÷ 6", c.v / 6, "mL/h", src, fn);
      out.push(block("sam.chol.c.h", "danger", [
        ["sam.chol.c.1", { b: b.v }], ["sam.chol.c.2", { c: c.v, r: rc.v }],
        ["sam.chol.c.3", {}], ["sam.chol.c.4", {}]
      ], [b, c, rc]));
    }
    return out;
  }

  var PROTOCOLS = {

    // ── WHO Pocket Book 2013 (+ WHO 2023 wasting guideline) — default ──
    who: {
      id: "who", nameKey: "sam.p.who", defaultFluid: "resomal",
      shockDefKey: "sam.who.shockdef",
      sources: [
        { t: "WHO. Pocket book of hospital care for children, 2nd ed. 2013 — §7.4.1 (p. 201–202), §7.4.3 (pp. 203–206), Chart 8 (p. 14).", u: S.whoPb2013 },
        { t: "WHO. Guideline on the prevention and management of wasting and nutritional oedema, 2023 — B6–B8.", u: S.who2023 },
        { t: "WHO. Updates on the management of severe acute malnutrition in infants and children, 2013.", u: S.who2013 }
      ],
      build: function (ctx) {
        var w = ctx.w, src = S.whoPb2013, fn = "who";
        var out = [block("sam.diag.h", "info", [["sam.who.diag.1", {}], ["sam.who.diag.2", {}]])];
        var ivNoOral = ctx.hyd === "severe" && !ctx.oralOk;
        if (ctx.shock || ivNoOral) {
          var v15 = perKg("w.sam.bolus", 15, "mL/kg", w, "mL", src, fn);
          var r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
          var m4  = perKg("w.sam.maint", 4, "mL/kg/h", w, "mL/h", src, fn);
          var b10 = perKg("w.sam.blood", 10, "mL/kg", w, "mL", src, fn);
          var g5  = perKg("w.sam.glucose", 5, "mL/kg", w, "mL", src, fn);
          out.push(block(ctx.shock ? "sam.who.shock.h" : "sam.who.ivNoOral.h", "danger", [
            ["sam.who.shock.glu", { g: g5.v }],
            ["sam.who.shock.1", { v: v15.v }],
            ["sam.who.shock.2", {}],
            ["sam.who.shock.3", { v: v15.v, r10: r10.v }],
            ["sam.who.shock.4", { m4: m4.v, b10: b10.v }],
            ["sam.who.shock.5", {}]
          ], [g5, v15, r10, m4, b10]));
        } else if (ctx.hyd === "none") {
          out.push(block("sam.who.prev.h", null, [["sam.who.prev.1", {}], ["sam.who.prev.2", {}]]));
        } else {
          var d5 = perKg("w.sam.dose", 5, "mL/kg", w, "mL", src, fn);
          var t2 = line("w.sam.total", "4 doses × dose", "4 × " + n(d5.v), 4 * d5.v, "mL", src, fn);
          var lo = perKg("w.sam.rateLo", 5, "mL/kg/h", w, "mL/h", src, fn);
          var hi = perKg("w.sam.rateHi", 10, "mL/kg/h", w, "mL/h", src, fn);
          out.push(block("sam.who.oral.h", "warn", [
            ["sam.who.oral.1", mix(fluidVar(ctx), { d5: d5.v, t2: t2.v })],
            ["sam.who.oral.2", { lo: lo.v, hi: hi.v }],
            ["sam.who.oral.3", {}], ["sam.who.oral.4", {}], ["sam.who.oral.5", {}], ["sam.who.oral.6", {}]
          ], [d5, t2, lo, hi]));
        }
        return out;
      }
    },

    // ── MSF Clinical guidelines — Severe acute malnutrition (Feb 2024) ──
    msf: {
      id: "msf", nameKey: "sam.p.msf", defaultFluid: "resomal",
      shockDefKey: "sam.msf.shockdef",
      sources: [
        { t: "Médecins Sans Frontières. Clinical guidelines — Severe acute malnutrition (last updated Feb 2024): Diarrhoea and dehydration, Plans A/B/C SAM.", u: S.msfSam },
        { t: "Médecins Sans Frontières. Essential drugs — ReSoMal oral (last updated Nov 2022).", u: S.msfResomal }
      ],
      build: function (ctx) {
        var w = ctx.w, src = S.msfSam, fn = "msf";
        var out = [block("sam.diag.h", "info", [["sam.msf.diag", {}]])];
        var r10, r20, s5, tw;
        if (ctx.shock) {
          tw = targetWeight(ctx, 1.1, src, fn);
          var cef = perKg("w.sam.drug", 80, "mg/kg", w, "mg", src, fn);
          r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
          out.push(block("sam.msf.shock.h", "danger", [
            ["sam.msf.target", { tw: tw.v, basis: { key: tw.basis } }],
            ["sam.msf.c.mon", {}],
            ["sam.msf.shock.1", { cef: cef.v }], ["sam.msf.shock.2", { r10: r10.v }],
            ["sam.msf.shock.3", { tw: tw.v }], ["sam.msf.shock.4", { r10: r10.v }]
          ], [tw.work, cef, r10]));
        } else if (ctx.hyd === "none") {
          s5 = perKg("w.sam.dose", 5, "mL/kg", w, "mL", src, fn);
          out.push(block("sam.msf.a.h", null, [
            ["sam.msf.a.1", { s5: s5.v }], ["sam.msf.a.2", { s5: s5.v }], ["sam.msf.a.3", {}]
          ], [s5]));
        } else if (ctx.hyd === "some") {
          tw = targetWeight(ctx, 1.06, src, fn);
          r20 = perKg("w.sam.rate", 20, "mL/kg/h", w, "mL/h", src, fn);
          var t40 = line("w.sam.total", "rate × 2 h", n(r20.v) + " × 2", r20.v * 2, "mL", src, fn);
          r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
          s5 = perKg("w.sam.dose", 5, "mL/kg", w, "mL", src, fn);
          out.push(block("sam.msf.b.h", "warn", [
            ["sam.msf.target", { tw: tw.v, basis: { key: tw.basis } }],
            ["sam.msf.b.1", { r20: r20.v, t40: t40.v, s5: s5.v }],
            ["sam.msf.b.2", { r10: r10.v }], ["sam.msf.b.3", {}], ["sam.msf.b.4", {}]
          ], [tw.work, r20, t40, r10, s5]));
        } else {
          tw = targetWeight(ctx, 1.1, src, fn);
          var items = [["sam.msf.target", { tw: tw.v, basis: { key: tw.basis } }], ["sam.msf.c.mon", {}]];
          var work = [tw.work];
          if (ctx.oralOk) {
            var v20 = perKg("w.sam.total", 20, "mL/kg", w, "mL", src, fn);
            items.push(["sam.msf.c.1", { v20: v20.v }], ["sam.msf.c.2", { tw: tw.v }]);
            work.push(v20);
          } else {
            r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
            items.push(["sam.msf.c.3", { r10: r10.v }], ["sam.msf.c.4", { r10: r10.v }]);
            work.push(r10);
          }
          out.push(block("sam.msf.c.h", "danger", items, work));
        }
        out.push(block("sam.overload.h", null, [["sam.msf.overload", {}]]));
        return out;
      }
    },

    // ── ACF International (Golden) 2011 — weight-guided ─────────────────
    acf: {
      id: "acf", nameKey: "sam.p.acf", defaultFluid: "resomal",
      shockDefKey: "sam.acf.shockdef",
      sources: [
        { t: "Action Contre la Faim International. Guidelines for the integrated management of severe acute malnutrition: in- and out-patient treatment. Dec 2011 — pp. 72–78.", u: S.acf2011 }
      ],
      build: function (ctx) {
        var w = ctx.w, src = S.acf2011, fn = "acf";
        var out = [block("sam.diag.h", "info", [["sam.acf.diag.1", {}], ["sam.acf.diag.2", {}], ["sam.acf.diag.3", {}]])];
        if (ctx.oedema >= 1) {
          out.push(block("sam.acf.oedema.h", "warn", [["sam.acf.oedema", {}]]));
          return out;
        }
        if (ctx.preW && ctx.preW <= w && ctx.hyd !== "none") {
          out.push(block("sam.acf.noloss.h", "warn", [["sam.acf.noloss", { pre: ctx.preW, w: w }]]));
          return out;
        }
        var r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
        if (ctx.shock) {
          var v15 = perKg("w.sam.bolus", 15, "mL/kg", w, "mL", src, fn);
          out.push(block("sam.acf.shock.h", "danger", [
            ["sam.acf.shock.1", { v15: v15.v }], ["sam.acf.shock.2", { v15: v15.v }],
            ["sam.acf.shock.3", { r10: r10.v }], ["sam.acf.shock.4", {}]
          ], [v15, r10]));
        } else if (ctx.hyd === "none") {
          out.push(block("sam.acf.a.h", null, [["sam.acf.a.1", {}]]));
        } else {
          var tw, twKey;
          if (ctx.preW && ctx.preW > w) {
            tw = line("w.sam.target", "pre-diarrhoea weight", n(ctx.preW) + " kg", ctx.preW, "kg", src, fn);
            twKey = "sam.acf.target.pre";
          } else {
            tw = line("w.sam.target", "current weight × 1.05 (maximum)", n(w) + " kg × 1.05", w * 1.05, "kg", src, fn);
            twKey = "sam.acf.target.est";
          }
          var r15 = perKg("w.sam.rate", 15, "mL/kg/h", w, "mL/h", src, fn);
          var r20 = perKg("w.sam.rate", 20, "mL/kg/h", w, "mL/h", src, fn);
          var t50 = perKg("w.sam.total", 50, "mL/kg", w, "mL", src, fn);
          out.push(block("sam.acf.oral.h", "warn", [
            [twKey, { tw: tw.v }],
            ["sam.acf.oral.1", { r10: r10.v }], ["sam.acf.oral.2", { r20: r20.v, r15: r15.v }],
            ["sam.acf.oral.3", {}], ["sam.acf.oral.4", { t50: t50.v }]
          ], [tw, r10, r15, r20, t50]));
        }
        out.push(block("sam.overload.h", null, [["sam.acf.stop", {}]]));
        return out;
      }
    },

    // ── India MoHFW 2011 — facility-based SAM ───────────────────────────
    india: {
      id: "india", nameKey: "sam.p.india", defaultFluid: "orsK",
      shockDefKey: "sam.ind.shockdef",
      sources: [
        { t: "Ministry of Health & Family Welfare, Government of India. Operational guidelines on facility based management of children with severe acute malnutrition. 2011 — §5.3a–5.3b (pp. 42–45).", u: S.india2011 }
      ],
      build: function (ctx) {
        var w = ctx.w, src = S.india2011, fn = "india";
        var out = [];
        if (ctx.shock || (ctx.hyd === "severe" && !ctx.oralOk)) {
          var g5 = perKg("w.sam.glucose", 5, "mL/kg", w, "mL", src, fn);
          var v15 = perKg("w.sam.bolus", 15, "mL/kg", w, "mL", src, fn);
          var r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
          var m4 = perKg("w.sam.maint", 4, "mL/kg/h", w, "mL/h", src, fn);
          out.push(block("sam.ind.shock.h", "danger", [
            ["sam.ind.shock.1", { g: g5.v }], ["sam.ind.shock.2", { v15: v15.v }],
            ["sam.ind.shock.3", { v15: v15.v, r10: r10.v }], ["sam.ind.shock.4", { m4: m4.v }],
            ["sam.ind.shock.5", {}]
          ], [g5, v15, r10, m4]));
        } else if (ctx.hyd === "none") {
          var ml = ctx.months == null ? null : (ctx.months < 24 ? 50 : 100);
          out.push(block("sam.ind.prev.h", null, [
            [ml == null ? "sam.ind.prev" : "sam.ind.prev.age", { ml: ml }]
          ], ml == null ? [] : [line("w.sam.dose", "age < 24 months → 50 mL · ≥ 24 months → 100 mL",
            n(ctx.months) + " months", ml, "mL", src, fn)]));
        } else {
          var d5 = perKg("w.sam.dose", 5, "mL/kg", w, "mL", src, fn);
          var lo = perKg("w.sam.doseLo", 5, "mL/kg", w, "mL", src, fn);
          var hi = perKg("w.sam.doseHi", 10, "mL/kg", w, "mL", src, fn);
          out.push(block("sam.ind.oral.h", "warn", [
            ["sam.ind.oral.1", mix(fluidVar(ctx), { d5: d5.v })],
            ["sam.ind.oral.2", { lo: lo.v, hi: hi.v }],
            ["sam.ind.oral.3", {}], ["sam.ind.oral.4", {}], ["sam.ind.oral.5", {}]
          ], [d5, lo, hi]));
        }
        return out;
      }
    },

    // ── Kenya Basic Paediatric Protocols, 5th ed. (Feb 2022) ────────────
    kenya: {
      id: "kenya", nameKey: "sam.p.kenya", defaultFluid: "resomal",
      shockDefKey: "sam.ken.shockdef",
      sources: [
        { t: "Ministry of Health, Kenya. Basic Paediatric Protocols, 5th ed. Feb 2022 — Fluid management in severe malnutrition with diarrhoea.", u: S.kenya2022 },
        { t: "Official print edition (University of Nairobi, Oct 2022).", u: "https://paediatrics.uonbi.ac.ke/sites/paediatrics.uonbi.ac.ke/files/2023-04/Basic%20Paediatric%20protocol%205th%20edition%20FOR%20PRINT%2031st%20Oct%202022.pdf" }
      ],
      build: function (ctx) {
        var w = ctx.w, src = S.kenya2022, fn = "kenya";
        var out = [];
        if (ctx.shock) {
          var v20 = perKg("w.sam.bolus", 20, "mL/kg", w, "mL", src, fn);
          var rs = line("w.sam.rate", "volume ÷ 2 h", n(v20.v) + " ÷ 2", v20.v / 2, "mL/h", src, fn);
          out.push(block("sam.ken.shock.h", "danger", [
            ["sam.ken.shock.1", { v20: v20.v, r: rs.v }], ["sam.ken.shock.2", {}]
          ], [v20, rs]));
        }
        if (ctx.hyd === "none" && !ctx.shock) {
          out.push(block("sam.ken.prev.h", null, [["sam.ken.prev", {}]]));
        } else {
          var items = [], work = [];
          if (!ctx.oralOk) {
            var m4 = perKg("w.sam.maint", 4, "mL/kg/h", w, "mL/h", src, fn);
            items.push(["sam.ken.iv", { m4: m4.v }]); work.push(m4);
          }
          var r10 = perKg("w.sam.rate", 10, "mL/kg/h", w, "mL/h", src, fn);
          var r75 = perKg("w.sam.rate", 7.5, "mL/kg/h", w, "mL/h", src, fn);
          var lo = perKg("w.sam.rateLo", 5, "mL/kg/h", w, "mL/h", src, fn);
          var hi = perKg("w.sam.rateHi", 10, "mL/kg/h", w, "mL/h", src, fn);
          var b10 = perKg("w.sam.blood", 10, "mL/kg", w, "mL", src, fn);
          var f1 = perKg("w.sam.drug", 1, "mg/kg", w, "mg", src, fn);
          items.push(["sam.ken.oral.1", { r10: r10.v }], ["sam.ken.oral.2", { r75: r75.v, lo: lo.v, hi: hi.v }],
            ["sam.ken.oral.3", {}], ["sam.ken.hb", { b10: b10.v, f1: f1.v }]);
          work.push(r10, r75, lo, hi, b10, f1);
          out.push(block(ctx.shock ? "sam.ken.after.h" : "sam.ken.oral.h", "warn", items, work));
        }
        return out;
      }
    }
  };

  var ORDER = ["who", "msf", "acf", "india", "kenya"];

  // → { protocol, fluid, blocks }
  function plan(protocolId, ctx) {
    var p = PROTOCOLS[protocolId] || PROTOCOLS.who;
    var c = mix(ctx, {});
    if (!c.fluid || c.fluid === "auto") c.fluid = p.defaultFluid;
    var blocks = c.cholera ? cholera(c) : p.build(c);
    return { protocol: p, fluid: c.fluid, blocks: blocks };
  }

  root.RH_SAM = { PROTOCOLS: PROTOCOLS, ORDER: ORDER, plan: plan };
  if (typeof module !== "undefined" && module.exports) module.exports = root.RH_SAM;
})(typeof window !== "undefined" ? window : globalThis);
