/**
 * src/topics/machine_design/springs/period_frequency/schema.js
 * Period and Frequency schema (Lecture Video section 11).
 */

import { SPRING_BASE_VARS } from "../common/index.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const PERIOD_FREQUENCY_VARS_DB = Object.freeze({
  "T_period": {
    name: "Oscillation Period",
    symbol: "T",
    dimension: DIMENSIONS.TIME,
    unit: "s",
    nameAliases: ["Oscillation Period", "Period of Motion", "Cycle Time"],
    symbolAliases: ["T"],
    aliases: ["Oscillation Period", "Period of Motion", "Cycle Time", "T_period", "T"]
  },
  "f": {
    name: "Frequency",
    symbol: "f",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    nameAliases: ["Frequency", "Cyclic Frequency", "Natural Frequency"],
    symbolAliases: ["f", "n_f"],
    aliases: ["Frequency", "Cyclic Frequency", "Natural Frequency", "f"]
  },
  "m": {
    name: "Vibrating Mass",
    symbol: "m",
    dimension: DIMENSIONS.MASS,
    unit: "kg",
    nameAliases: ["Vibrating Mass", "Attached Mass", "Suspended Mass"],
    symbolAliases: ["m", "M"],
    aliases: ["Vibrating Mass", "Attached Mass", "Suspended Mass", "m"]
  },
  "k": {
    ...SPRING_BASE_VARS.k,
    unit: "N/m"
  },
  "L_p": {
    name: "Pendulum Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "m",
    nameAliases: ["Pendulum Length", "Simple Pendulum Length"],
    symbolAliases: ["L", "L_p"],
    aliases: ["Pendulum Length", "Simple Pendulum Length", "L_p", "L"]
  },
  "g": {
    name: "Gravitational Acceleration",
    symbol: "g",
    dimension: DIMENSIONS.ACCELERATION,
    unit: "m/s^2",
    isConstant: true,
    display: 9.81,
    nameAliases: ["Gravitational Acceleration", "Acceleration Due to Gravity"],
    symbolAliases: ["g"],
    aliases: ["Gravitational Acceleration", "Acceleration Due to Gravity", "g"]
  }
});
