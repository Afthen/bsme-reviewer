export function createGroundTruthHelicalSystem() {
  const isSI = Math.random() < 0.5;
  const sys = isSI ? "SI" : "US";
  const psi = [15, 20, 25, 30][Math.floor(Math.random() * 4)];
  const phi_n = [14.5, 20][Math.floor(Math.random() * 2)];
  const psiRad = (psi * Math.PI) / 180;
  const phinRad = (phi_n * Math.PI) / 180;

  // tan(phi) = tan(phi_n) / cos(psi)
  const tanPhi = Math.tan(phinRad) / Math.cos(psiRad);
  const phi = parseFloat(((Math.atan(tanPhi) * 180) / Math.PI).toFixed(2));

  const T_1 = [15, 17, 19, 21, 23][Math.floor(Math.random() * 5)];
  const VR = [2, 2.5, 3, 4][Math.floor(Math.random() * 4)];
  const T_2 = Math.round(T_1 * VR);

  let S = {};

  if (isSI) {
    const m_n = [2, 2.5, 3, 4, 5][Math.floor(Math.random() * 5)]; // normal module
    const P_cn = parseFloat((Math.PI * m_n).toFixed(3));
    const P_c = parseFloat((P_cn / Math.cos(psiRad)).toFixed(3));
    const P_a = parseFloat((P_c / Math.tan(psiRad)).toFixed(3));
    const m = parseFloat((m_n / Math.cos(psiRad)).toFixed(3)); // transverse module
    const D_P1 = parseFloat((T_1 * m).toFixed(1));
    const D_P2 = parseFloat((T_2 * m).toFixed(1));
    const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(2));

    const n_1 = [900, 1200, 1750][Math.floor(Math.random() * 3)];
    const n_2 = parseFloat((n_1 / VR).toFixed(1));
    const V_m = parseFloat(((Math.PI * (D_P1 / 1000) * n_1) / 60).toFixed(2));

    const P = [10, 15, 25, 40][Math.floor(Math.random() * 4)]; // kW
    const W_t = Math.round((1000 * P) / V_m); // N
    const M_t = parseFloat(((W_t * (D_P1 / 1000)) / 2).toFixed(2));
    const F_a = Math.round(W_t * Math.tan(psiRad)); // Thrust
    const W_r = Math.round(W_t * tanPhi); // Radial
    const W = Math.round(Math.sqrt(W_t ** 2 + W_r ** 2 + F_a ** 2)); // Total normal

    const _u = {
      D_P1: "mm", D_P2: "mm", C: "mm", P_c: "mm", P_cn: "mm", P_a: "mm",
      V_m: "m/s", P: "kW", M_t: "N-m", W_t: "N", W_r: "N", F_a: "N", W: "N",
      phi: "deg", phi_n: "deg", psi: "deg", n_1: "rpm", n_2: "rpm",
      T_1: "teeth", T_2: "teeth"
    };

    S = { sys, psi, phi_n, phi, T_1, T_2, VR, n_1, n_2, D_P1, D_P2, C, P_c, P_cn, P_a, V_m, P, W_t, M_t, F_a, W_r, W, _u };
  } else {
    const P_dn = [8, 10, 12, 16][Math.floor(Math.random() * 4)];
    const P_d = parseFloat((P_dn * Math.cos(psiRad)).toFixed(3));
    const P_c = parseFloat((Math.PI / P_d).toFixed(4));
    const P_cn = parseFloat((P_c * Math.cos(psiRad)).toFixed(4));
    const P_a = parseFloat((P_c / Math.tan(psiRad)).toFixed(4));
    const D_P1 = parseFloat((T_1 / P_d).toFixed(3));
    const D_P2 = parseFloat((T_2 / P_d).toFixed(3));
    const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(3));

    const n_1 = [900, 1200, 1750][Math.floor(Math.random() * 3)];
    const n_2 = parseFloat((n_1 / VR).toFixed(1));
    const V_m = Math.round(Math.PI * (D_P1 / 12) * n_1); // ft/min

    const P = [10, 20, 30, 50][Math.floor(Math.random() * 4)]; // hp
    const W_t = Math.round((33000 * P) / V_m); // lb
    const M_t = parseFloat(((W_t * D_P1) / 2).toFixed(2));
    const F_a = Math.round(W_t * Math.tan(psiRad));
    const W_r = Math.round(W_t * tanPhi);
    const W = Math.round(Math.sqrt(W_t ** 2 + W_r ** 2 + F_a ** 2));

    const _u = {
      D_P1: "in", D_P2: "in", C: "in", P_c: "in", P_cn: "in", P_a: "in", P_d: "teeth/in", P_dn: "teeth/in",
      V_m: "ft/min", P: "hp", M_t: "lb-in", W_t: "lb", W_r: "lb", F_a: "lb", W: "lb",
      phi: "deg", phi_n: "deg", psi: "deg", n_1: "rpm", n_2: "rpm",
      T_1: "teeth", T_2: "teeth"
    };

    S = { sys, psi, phi_n, phi, T_1, T_2, VR, n_1, n_2, D_P1, D_P2, C, P_d, P_dn, P_c, P_cn, P_a, V_m, P, W_t, M_t, F_a, W_r, W, _u };
  }

  return S;
}
