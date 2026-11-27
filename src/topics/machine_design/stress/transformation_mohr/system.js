/**
 * src/topics/machine_design/stress/transformation_mohr/system.js
 * Ground-truth generator for 2D/3D Stress Transformation & Mohr's Circle.
 * Reference: Beer & Johnston, Mechanics of Materials, Ch. 7; Hibbeler, Ch. 9.
 */

import { TRANSFORMATION_MOHR_VARS_DB } from "./schema.js";

export function createTransformationMohrSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let sigma_x, sigma_y, tau_xy, sigma_avg, sigma_diff, R_c, tau_max_in, sigma_1, sigma_2;
  let theta_p, theta_2p, theta_s, theta_2s, theta, theta_2, sigma_xp, sigma_yp, tau_xyp;
  let sigma_3, tau_13, tau_23, sigma_m3d, sigma_vm3d, E, nu, eps_1, _u;

  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;

  if (isUS) {
    sigma_x = 20.4; // ksi
    sigma_y = 8.4; // ksi
    tau_xy = 8.0; // ksi
    sigma_3 = -24.4; // ksi
    E = 10000.0; // ksi
    nu = 0.33;
    theta = 20.0; // deg
  } else {
    sigma_x = 140.4; // MPa
    sigma_y = 60.4; // MPa
    tau_xy = 30.0; // MPa
    sigma_3 = -170.4; // MPa
    E = 76.0; // GPa
    nu = 0.33;
    theta = 20.0; // deg
  }

  sigma_avg = (sigma_x + sigma_y) / 2;
  sigma_diff = (sigma_x - sigma_y) / 2;
  R_c = Math.sqrt(sigma_diff * sigma_diff + tau_xy * tau_xy);
  sigma_1 = sigma_avg + R_c;
  sigma_2 = sigma_avg - R_c;
  tau_max_in = (sigma_1 - sigma_2) / 2;

  theta_2p = Math.atan(tau_xy / sigma_diff) * rad2deg;
  theta_p = theta_2p / 2;
  theta_2s = Math.atan(-sigma_diff / tau_xy) * rad2deg;
  theta_s = theta_2s / 2;

  theta_2 = 2 * theta;
  const rad2 = theta_2 * deg2rad;
  sigma_xp = sigma_avg + sigma_diff * Math.cos(rad2) + tau_xy * Math.sin(rad2);
  sigma_yp = sigma_avg - sigma_diff * Math.cos(rad2) - tau_xy * Math.sin(rad2);
  tau_xyp = -sigma_diff * Math.sin(rad2) + tau_xy * Math.cos(rad2);

  tau_13 = (sigma_1 - sigma_3) / 2;
  tau_23 = (sigma_2 - sigma_3) / 2;
  sigma_m3d = (sigma_1 + sigma_2 + sigma_3) / 3;
  sigma_vm3d = Math.sqrt(
    (Math.pow(sigma_1 - sigma_2, 2) + Math.pow(sigma_2 - sigma_3, 2) + Math.pow(sigma_3 - sigma_1, 2)) / 2
  );

  if (isUS) {
    eps_1 = (sigma_1 - nu * (sigma_2 + sigma_3)) / E;
    _u = {
      sigma_x: "ksi", sigma_y: "ksi", tau_xy: "ksi",
      sigma_avg: "ksi", sigma_diff: "ksi", R_c: "ksi", tau_max_in: "ksi",
      sigma_1: "ksi", sigma_2: "ksi",
      theta_p: "°", theta_2p: "°", theta_s: "°", theta_2s: "°", theta: "°", theta_2: "°",
      sigma_xp: "ksi", sigma_yp: "ksi", tau_xyp: "ksi",
      sigma_3: "ksi", tau_13: "ksi", tau_23: "ksi", sigma_m3d: "ksi", sigma_vm3d: "ksi",
      E: "ksi", nu: "dimless", eps_1: "dimless"
    };
  } else {
    eps_1 = (sigma_1 - nu * (sigma_2 + sigma_3)) / (E * 1000);
    _u = {
      sigma_x: "MPa", sigma_y: "MPa", tau_xy: "MPa",
      sigma_avg: "MPa", sigma_diff: "MPa", R_c: "MPa", tau_max_in: "MPa",
      sigma_1: "MPa", sigma_2: "MPa",
      theta_p: "°", theta_2p: "°", theta_s: "°", theta_2s: "°", theta: "°", theta_2: "°",
      sigma_xp: "MPa", sigma_yp: "MPa", tau_xyp: "MPa",
      sigma_3: "MPa", tau_13: "MPa", tau_23: "MPa", sigma_m3d: "MPa", sigma_vm3d: "MPa",
      E: "GPa", nu: "dimless", eps_1: "dimless"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(TRANSFORMATION_MOHR_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    sigma_x, sigma_y, tau_xy, sigma_avg, sigma_diff, R_c, tau_max_in, sigma_1, sigma_2,
    theta_p, theta_2p, theta_s, theta_2s, theta, theta_2, sigma_xp, sigma_yp, tau_xyp,
    sigma_3, tau_13, tau_23, sigma_m3d, sigma_vm3d, E, nu, eps_1,
    _names, _u
  };
}
