/* PRhehydrate — formulas. Each returns its result plus `work` lines:
 * { k: label key, f: formula, x: expression, v: value, u: unit, src, fn }. */
(function (root) {
  "use strict";

  // ── sources ──
  var SRC = {
    whoTod:     "https://www.who.int/publications/i/item/9241593180",
    whoPb2013:  "https://www.who.int/publications/i/item/978-92-4-154837-3",
    who2023:    "https://iris.who.int/handle/10665/376075",
    who2013:    "https://iris.who.int/handle/10665/95584",
    holliday:   "https://doi.org/10.1542/peds.19.5.823",
    goldman:    "https://doi.org/10.1542/peds.2007-3141",
    king2003:   "https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5216a1.htm",
    guarino:    "https://doi.org/10.1097/MPG.0000000000000375",
    msfSam:     "https://medicalguidelines.msf.org/en/viewport/CG/english/severe-acute-malnutrition-16689141.html",
    msfResomal: "https://medicalguidelines.msf.org/en/viewport/EssDr/english/resomal-rehydration-solution-for-malnutrition-oral-16684569.html",
    msfCholera: "https://medicalguidelines.msf.org/en/viewport/CHOL/english/5-8-cholera-and-acute-malnutrition-32409733.html",
    acf2011:    "https://www.actionagainsthunger.org/app/uploads/2022/09/Guidelines_For_the_integrated_management_of_severe_acute_malnutrition_In_and_out_patient_treatment_12.2011.pdf",
    india2011:  "https://nhm.assam.gov.in/sites/default/files/swf_utility_folder/departments/nhm_lipl_in_oid_6/do_u_want_2_know/Operational%20Guidelines%20on%20Facility%20Based%20Management%20of%20Children%20with%20Severe%20Acute%20Malnutrition.pdf",
    kenya2022:  "https://kijabehospital.or.ke/uploads/guidelines/1712736965_Basic_Paediatric_Protocols-JAN_27_2022_DRAFT_SW.pdf",
    gastrosam:  "https://doi.org/10.1016/S2352-4642(25)00371-2",
    nice:       "https://www.nice.org.uk/guidance/cg84",
    whoGrowth:  "https://www.who.int/tools/child-growth-standards/standards/weight-for-length-height",
    aap2018:    "https://doi.org/10.1542/peds.2018-3083"
  };

  // ≤ 2 decimals, "." separator
  function n(x) { return String(Math.round(x * 100) / 100); }

  function line(k, f, x, v, u, src, fn) {
    return { k: k, f: f, x: x, v: v, u: u || "", src: src || null, fn: fn || null };
  }

  function perKg(k, rate, rateUnit, w, u, src, fn) {
    return line(k, rate + " " + rateUnit + " × weight", n(rate) + " " + rateUnit + " × " + n(w) + " kg",
      rate * w, u, src, fn);
  }

  // Goldman CDS: 4 items, each 0–2. 0 = none, 1–4 = some, 5–8 = moderate/severe.
  function cdsSeverity(items) {
    var keys = ["appearance", "eyes", "mucous", "tears"], s = 0, parts = [];
    for (var i = 0; i < keys.length; i++) {
      if (items[keys[i]] == null) return null;
      s += items[keys[i]]; parts.push(n(items[keys[i]]));
    }
    var key = s === 0 ? "none" : (s <= 4 ? "some" : "severe");
    return { score: s, key: key, work: [
      line("w.cds", "appearance + eyes + mucous membranes + tears (0–2 each)", parts.join(" + "), s, "/ 8",
        SRC.goldman, "cdsSeverity"),
      line("w.cdsBand", "0 → none · 1–4 → some · 5–8 → moderate/severe", n(s), key, "", SRC.goldman, "cdsSeverity")
    ]};
  }

  // WHO/IMCI: ≥2 signs in column C = severe; ≥2 signs in B or C = some.
  function whoSeverity(items) {
    var keys = ["condition", "eyes", "thirst", "skin"], c = 0, bc = 0;
    for (var i = 0; i < keys.length; i++) {
      var v = items[keys[i]]; if (v == null) return null;
      if (v === 2) c++;
      if (v >= 1) bc++;
    }
    var key = c >= 2 ? "severe" : (bc >= 2 ? "some" : "none");
    return { key: key, work: [
      line("w.whoC", "count of signs in column C", n(c), c, "", SRC.whoTod, "whoSeverity"),
      line("w.whoBC", "count of signs in column B or C", n(bc), bc, "", SRC.whoTod, "whoSeverity"),
      line("w.whoRule", "C ≥ 2 → severe · B+C ≥ 2 → some · else none", "C = " + c + ", B+C = " + bc, key, "",
        SRC.whoTod, "whoSeverity")
    ]};
  }

  // % dehydration from weight loss, capped at 15%.
  function deficitFromWeightLoss(well, cur) {
    if (!well || !cur || well <= cur) return null;
    var p = (well - cur) / well * 100;
    var pc = Math.min(p, 15);
    return { pct: pc, raw: p, work: [
      line("w.wlPct", "(well weight − current weight) ÷ well weight × 100",
        "(" + n(well) + " − " + n(cur) + ") ÷ " + n(well) + " × 100", p, "%", SRC.king2003, "deficitFromWeightLoss")
    ].concat(p > 15 ? [line("w.cap", "capped at 15%", n(p) + " → 15", 15, "%", null, "deficitFromWeightLoss")] : []) };
  }

  // 1% of body weight lost ≈ 10 mL/kg of fluid (1 kg ≈ 1 L).
  function deficitVolume(pct, w) {
    var v = pct * w * 10;
    return { v: v, work: [
      line("w.deficitVol", "deficit % × weight × 10 mL/kg per %", n(pct) + " × " + n(w) + " × 10", v, "mL",
        SRC.king2003, "deficitVolume")
    ]};
  }

  // Holliday–Segar: 100 mL/kg for first 10 kg, 50 mL/kg next 10 kg, 20 mL/kg above 20 kg.
  function maintenance(w) {
    var d, x;
    if (w <= 10)      { d = w * 100;                 x = n(w) + " × 100"; }
    else if (w <= 20) { d = 1000 + (w - 10) * 50;    x = "(10 × 100) + (" + n(w) + " − 10) × 50"; }
    else              { d = 1500 + (w - 20) * 20;    x = "(10 × 100) + (10 × 50) + (" + n(w) + " − 20) × 20"; }
    var h = d / 24;
    return { daily: d, hourly: h, work: [
      line("w.maint24", "100 mL/kg (first 10 kg) + 50 mL/kg (next 10 kg) + 20 mL/kg (each kg over 20)",
        x, d, "mL/day", SRC.holliday, "maintenance"),
      line("w.maintHr", "daily ÷ 24", n(d) + " ÷ 24", h, "mL/h", SRC.holliday, "maintenance")
    ]};
  }

  // Ongoing losses: 10 mL/kg per watery stool, 2 mL/kg per emesis (CDC/King 2003).
  function ongoingLosses(stools, emesis, w) {
    var ps = 10 * w, pe = 2 * w, v = stools * ps + emesis * pe;
    return { v: v, perStool: ps, perEmesis: pe, work: [
      perKg("w.perStool", 10, "mL/kg", w, "mL", SRC.king2003, "ongoingLosses"),
      perKg("w.perEmesis", 2, "mL/kg", w, "mL", SRC.king2003, "ongoingLosses"),
      line("w.losses", "stools × per-stool + emesis × per-emesis",
        n(stools) + " × " + n(ps) + " + " + n(emesis) + " × " + n(pe), v, "mL", SRC.king2003, "ongoingLosses")
    ]};
  }

  // WHO Plan B: ORS rate mL/kg over N hours (WHO 75 mL/kg over 4 h).
  function planB(w, rate, hours) {
    var vol = rate * w, hr = vol / hours;
    return { vol: vol, perHour: hr, work: [
      perKg("w.planB", rate, "mL/kg", w, "mL", SRC.whoTod, "planB"),
      line("w.perHour", "volume ÷ hours", n(vol) + " ÷ " + n(hours), hr, "mL/h", SRC.whoTod, "planB")
    ]};
  }

  // WHO Plan C: 100 mL/kg — 30 mL/kg then 70 mL/kg; infants 1 h + 5 h, older 30 min + 2.5 h.
  function planCWho(w, months) {
    var infant = months != null && months < 12;
    var h1 = infant ? 1 : 0.5, h2 = infant ? 5 : 2.5;
    var total = 100 * w, first = 30 * w, rest = 70 * w;
    var r = {
      total: total, first: first, rest: rest, infant: infant, ageKnown: months != null,
      work: [
        perKg("w.total", 100, "mL/kg", w, "mL", SRC.whoPb2013, "planCWho"),
        perKg("w.first", 30, "mL/kg", w, "mL", SRC.whoPb2013, "planCWho"),
        perKg("w.rest", 70, "mL/kg", w, "mL", SRC.whoPb2013, "planCWho")
      ]
    };
    // rates for both age bands when age unknown, else for the relevant band
    [[true, 1, 5], [false, 0.5, 2.5]].forEach(function (b) {
      if (months != null && b[0] !== infant) return;
      r.work.push(line(b[0] ? "w.rateInfant1" : "w.rateChild1", "first ÷ hours",
        n(first) + " ÷ " + n(b[1]), first / b[1], "mL/h", SRC.whoPb2013, "planCWho"));
      r.work.push(line(b[0] ? "w.rateInfant2" : "w.rateChild2", "rest ÷ hours",
        n(rest) + " ÷ " + n(b[2]), rest / b[2], "mL/h", SRC.whoPb2013, "planCWho"));
    });
    r.firstRate = first / h1; r.restRate = rest / h2;
    return r;
  }

  // Bolus-first: 0–3 boluses of 20 mL/kg, then (deficit − boluses) + 12 h maintenance over 12 h.
  function planCBolus(w, deficitVol, maintHr, boluses) {
    var b = Math.max(0, Math.min(3, boluses == null ? 1 : boluses));
    var bolus = 20 * w, given = 20 * b * w;
    var remaining = Math.max(0, deficitVol - given);
    var maint12 = maintHr * 12, total = remaining + maint12, rate = total / 12;
    return { bolus: bolus, given: given, boluses: b, remaining: remaining, maint12: maint12, total: total,
      rate: rate, work: [
        perKg("w.bolus", 20, "mL/kg", w, "mL", SRC.whoPb2013, "planCBolus"),
        line("w.given", "boluses given × 20 mL/kg × weight", n(b) + " × 20 × " + n(w), given, "mL",
          null, "planCBolus"),
        line("w.remaining", "max(0, deficit − bolus volume given)",
          "max(0, " + n(deficitVol) + " − " + n(given) + ")", remaining, "mL", null, "planCBolus"),
        line("w.maint12", "hourly maintenance × 12", n(maintHr) + " × 12", maint12, "mL", SRC.holliday, "planCBolus"),
        line("w.total12", "remaining + 12 h maintenance", n(remaining) + " + " + n(maint12), total, "mL",
          null, "planCBolus"),
        line("w.rate12", "total ÷ 12 h", n(total) + " ÷ 12", rate, "mL/h", null, "planCBolus")
      ]};
  }

  // Serum sodium: < 130 hyponatraemic, 130–150 isonatraemic, > 150 hypernatraemic (NICE CG84).
  function sodiumBand(na) {
    if (na == null || isNaN(na)) return null;
    var k = na < 130 ? "hypo" : (na > 150 ? "hyper" : "iso");
    return { key: k, na: na, work: [
      line("w.na", "< 130 → hyponatraemic · 130–150 → isonatraemic · > 150 → hypernatraemic", n(na), k, "",
        SRC.nice, "sodiumBand")
    ]};
  }

  // Hypernatraemia: deficit + maintenance replaced evenly over 48 h (NICE CG84; Na⁺ fall ≤ 0.5 mmol/L/h).
  function slowRehydration(deficitVol, maintHr) {
    var m48 = maintHr * 48, total = deficitVol + m48, rate = total / 48;
    return { maint48: m48, total: total, rate: rate, work: [
      line("w.maint48", "hourly maintenance × 48", n(maintHr) + " × 48", m48, "mL", SRC.holliday, "slowRehydration"),
      line("w.total48", "deficit + 48 h maintenance", n(deficitVol) + " + " + n(m48), total, "mL", SRC.nice, "slowRehydration"),
      line("w.rate48", "total ÷ 48 h", n(total) + " ÷ 48", rate, "mL/h", SRC.nice, "slowRehydration")
    ]};
  }

  // Hypoglycaemia: 10% glucose 5 mL/kg IV (WHO Pocket Book 2013).
  function glucoseBolus(w) {
    var g = perKg("w.sam.glucose", 5, "mL/kg", w, "mL", SRC.whoPb2013, "glucoseBolus");
    return { v: g.v, work: [g] };
  }

  // No IV or IO: NG (or oral) ORS 20 mL/kg/h for 6 h (WHO Plan C).
  function planCNg(w) {
    var r = perKg("w.ngRate", 20, "mL/kg/h", w, "mL/h", SRC.whoTod, "planCNg");
    var tot = line("w.ngTotal", "rate × 6 h", n(r.v) + " × 6", r.v * 6, "mL", SRC.whoTod, "planCNg");
    return { rate: r.v, total: tot.v, work: [r, tot] };
  }

  // Bedside units: drops/min for a giving set, ORS sachets and 200 mL cups, 20 mg zinc tablets.
  function dripRate(mlPerHour, dropsPerMl) {
    var d = mlPerHour * dropsPerMl / 60;
    return { v: d, work: [line("w.drip", "rate × drops/mL ÷ 60", n(mlPerHour) + " × " + n(dropsPerMl) + " ÷ 60", d,
      "drops/min", null, "dripRate")] };
  }
  function sachets(ml, sachetMl) {
    var s = ml / sachetMl, cups = ml / 200;
    return { n: s, cups: cups, work: [
      line("w.sachets", "volume ÷ sachet size", n(ml) + " ÷ " + n(sachetMl), s, "sachets", null, "sachets"),
      line("w.cups", "volume ÷ 200 mL", n(ml) + " ÷ 200", cups, "cups", null, "sachets")
    ]};
  }
  function zincTablets(mg) {
    var t = mg / 20;
    return { n: t, label: t === 0.5 ? "½" : n(t), work: [line("w.zincTab", "mg ÷ 20 mg per tablet", n(mg) + " ÷ 20", t, "tablets",
      null, "zincTablets")] };
  }

  // No scale: APLS weight estimate. < 1 y: 0.5 × months + 4; 1–5 y: 2 × years + 8; 6–12 y: 3 × years + 7.
  function weightFromAge(months) {
    if (months == null || isNaN(months) || months < 0) return null;
    var y = Math.floor(months / 12), v, x;
    if (months < 12)     { v = 0.5 * months + 4; x = "0.5 × " + n(months) + " + 4"; }
    else if (months < 72) { v = 2 * y + 8;      x = "2 × " + y + " + 8"; }
    else                  { v = 3 * y + 7;      x = "3 × " + y + " + 7"; }
    return { v: v, work: [line("w.wEst", "age < 12 months → 0.5 × months + 4 · < 6 years → 2 × years + 8 · else 3 × years + 7",
      x, v, "kg", null, "weightFromAge")] };
  }

  // Weight-for-length/height band from the WHO 2006 −3 SD and −2 SD cut-offs (RH_WHZ).
  // Length (lying) under 24 months, height (standing) from 24 months; by cm if age unknown.
  function whzBand(cm, sex, months, w) {
    var D = root.RH_WHZ;
    if (!D || cm == null || isNaN(cm) || !w || (sex !== "m" && sex !== "f")) return null;
    var useLength = months != null ? months < 24 : cm < 87;
    var T = useLength ? D.wfl : D.wfh;
    var i = Math.round((cm - T.from) / T.step);
    if (i < 0 || i >= T.m3.length) return null;
    var c3 = T[sex + "3"][i], c2 = T[sex + "2"][i];
    var key = w < c3 ? "whz3" : (w < c2 ? "whz2" : "whzok");
    return { key: key, cut3: c3, cut2: c2, cm: T.from + i * T.step, table: useLength ? "wfl" : "wfh", work: [
      line("w.whzCut", "weight vs −3 SD and −2 SD cut-offs at this length/height",
        n(w) + " kg vs " + n(c3) + " / " + n(c2) + " kg", key, "", SRC.whoGrowth, "whzBand")
    ]};
  }

  // Zinc for acute diarrhoea: 10 mg/day under 6 months, 20 mg/day from 6 months, for 10–14 days.
  function zinc(months) {
    var mg = months < 6 ? 10 : 20;
    return { mg: mg, work: [
      line("w.zinc", "age < 6 months → 10 mg/day · ≥ 6 months → 20 mg/day", n(months) + " months", mg, "mg/day",
        SRC.whoTod, "zinc")
    ]};
  }

  // SAM (WHO 2023): WHZ < −3, MUAC < 115 mm (6–59 months), or bilateral pitting oedema.
  function samScreen(o) {
    var reasons = [], notes = [];
    var m = o.months;
    var muacApplies = m == null || (m >= 6 && m < 60);
    if (m != null && m < 6)   notes.push("sam.note.under6");
    if (m != null && m >= 60) notes.push("sam.note.over59");
    if (m == null && o.muac != null) notes.push("sam.note.ageUnknown");
    var work = [];
    if (o.muac != null && muacApplies) {
      var pos = o.muac < 115;
      work.push(line("w.muac", "MUAC < 115 mm → SAM", n(o.muac) + (pos ? " < 115" : " ≥ 115"), pos ? "SAM" : "—",
        "", SRC.who2023, "samScreen"));
      if (pos) reasons.push({ k: "sam.reason.muac", v: { muac: n(o.muac) } });
      else if (o.muac < 125) notes.push("sam.note.moderate");
    }
    if (o.oedema != null && o.oedema >= 1) {
      reasons.push({ k: "sam.reason.oedema", v: { grade: new Array(o.oedema + 1).join("+") } });
      work.push(line("w.oedema", "bilateral pitting oedema → SAM", new Array(o.oedema + 1).join("+"), "SAM", "",
        SRC.who2023, "samScreen"));
    }
    if (o.whzBand) {
      work = work.concat(o.whzBand.work);
      if (o.whzBand.key === "whz3") reasons.push({ k: "sam.reason.whz", v: {} });
      else if (o.whzBand.key === "whz2") notes.push("sam.note.whzMod");
    } else if (o.whz === "yes") {
      reasons.push({ k: "sam.reason.whz", v: {} });
      work.push(line("w.whz", "WHZ/WLZ < −3 → SAM", "< −3", "SAM", "", SRC.who2023, "samScreen"));
    }
    var complete = o.oedema != null && ((o.muac != null && muacApplies) || o.whz === "yes" || o.whz === "no");
    var status = reasons.length ? "pos" : (complete ? "neg" : "incomplete");
    return { status: status, reasons: reasons, notes: notes, muacApplies: muacApplies, work: work };
  }

  root.RH_CALC = {
    SRC: SRC, n: n, line: line, perKg: perKg,
    cdsSeverity: cdsSeverity, whoSeverity: whoSeverity,
    deficitFromWeightLoss: deficitFromWeightLoss, deficitVolume: deficitVolume,
    maintenance: maintenance, ongoingLosses: ongoingLosses,
    planB: planB, planCWho: planCWho, planCBolus: planCBolus, planCNg: planCNg,
    zinc: zinc, samScreen: samScreen,
    sodiumBand: sodiumBand, slowRehydration: slowRehydration, glucoseBolus: glucoseBolus,
    dripRate: dripRate, sachets: sachets, zincTablets: zincTablets,
    weightFromAge: weightFromAge, whzBand: whzBand
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.RH_CALC;
})(typeof window !== "undefined" ? window : globalThis);
