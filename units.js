// ========================================================
// units.js — Unit Metadata, Formatter & Conversion Utilities
// ========================================================
const Units = (() => {
  const FAMS = {
    length:    { u: { in: 1, ft: 12, mm: 1 / 25.4, cm: 1 / 2.54, m: 1000 / 25.4 } },
    force:     { u: { lb: 1, N: 0.224808943, kN: 224.808943, kgf: 2.20462 } },
    torque:    { u: { "lb-in": 1, "lb-ft": 12, "N-m": 8.85074579, "N-mm": 0.00885074579 } },
    power:     { u: { hp: 1, kW: 1.34102209, W: 0.00134102209 } },
    speed:     { u: { "ft/min": 1, "m/s": 196.850394, "m/min": 3.2808399, "in/s": 5 } },
    angspeed:  { u: { rpm: 1, "rad/s": 9.54929659, "rev/s": 60 } },
    stress:    { u: { psi: 1, ksi: 1000, MPa: 145.037738, kPa: 0.145037738, Pa: 0.000145037738 } },
    pitch:     { u: { "teeth/in": 1, "teeth/mm": 25.4 } },
    stiffness: { u: { "lb/in": 1, "N/mm": 5.710147, "N/m": 0.005710147 } },
    angle:     { u: { deg: 1, rad: 180 / Math.PI } },
    count:     { u: { dimless: 1, ratio: 1, teeth: 1 }, count: true }
  };

  const SYM = {};
  Object.entries(FAMS).forEach(([famName, famObj]) => {
    Object.keys(famObj.u).forEach(unitSymbol => {
      SYM[unitSymbol] = famName;
    });
  });

  const fam = unitSymbol => FAMS[SYM[unitSymbol]] || FAMS.count;
  const f = unitSymbol => (fam(unitSymbol).u[unitSymbol] !== undefined ? fam(unitSymbol).u[unitSymbol] : 1);

  const convert = (v, from, to) => {
    if (!from || !to || from === to) return v;
    return (v * f(from)) / f(to);
  };

  const isCount = unitSymbol => !!fam(unitSymbol).count;
  const compatible = unitSymbol => Object.keys(fam(unitSymbol).u);

  const tex = unitSymbol => {
    if (isCount(unitSymbol)) return unitSymbol === "teeth" ? "\\text{teeth}" : "";
    if (unitSymbol === "deg") return "°";
    return unitSymbol.split("-").map(p => `\\text{${p}}`).join("\\cdot ");
  };

  function fmtSig(v, sd = 4) {
    if (v === undefined || v === null || !isFinite(v)) return "";
    const n = Number(Number(v).toPrecision(sd));
    if (n !== 0 && (Math.abs(n) >= 1e7 || Math.abs(n) < 1e-4)) {
      const [m, e] = n.toExponential(sd - 1).split("e");
      return `${parseFloat(m)}\\times10^{${parseInt(e, 10)}}`;
    }
    return String(n);
  }

  const factorTex = (v, from, to) => {
    const factor = f(from) / f(to);
    return `${fmtSig(v)}\\,${tex(from)} \\times \\frac{${fmtSig(factor, 5)}\\,${tex(to)}}{1\\,${tex(from)}} = ${fmtSig(convert(v, from, to))}\\,${tex(to)}`;
  };

  return {
    FAMS, convert, isCount, compatible, tex, fmtSig, factorTex
  };
})();