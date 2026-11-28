/**
 * src/mastery/taxonomy.js
 * Hierarchical Engineering Mastery Taxonomy:
 *   Level 1: Governing Principle (universal conservation and constitutive laws)
 *   Level 2: Engineering Application (physical/domain manifestation)
 *   Level 3: Concrete Instance (specific equation / geometric variant)
 *
 * Provides bidirectional evidence propagation and prior inheritance so learning
 * transfers across related equations and topics without collapsing distinct
 * physical variables.
 */

export const PRINCIPLES = Object.freeze({
  FORCE_RESISTING_AREA: Object.freeze({
    id: "principle_force_resisting_area",
    name: "Force, Stress & Resisting Area",
    description: "Internal intensity of force distributed across resisting geometry (S = F / A_eff)"
  }),
  CAPACITY_DEMAND_SAFETY: Object.freeze({
    id: "principle_capacity_demand_safety",
    name: "Capacity, Demand & Safety Criteria",
    description: "Design margins, safety factors, and failure criteria (n = Capacity / Demand)"
  }),
  CONSTITUTIVE_ELASTIC: Object.freeze({
    id: "principle_constitutive_elastic",
    name: "Hooke's Law & Elastic Deformation",
    description: "Stress-strain, stiffness, spring rates, and elastic deflections (sigma = E*eps, k = F/delta)"
  }),
  KINEMATIC_POWER: Object.freeze({
    id: "principle_kinematic_power",
    name: "Kinematics & Power Transmission",
    description: "Rotational kinematics, torque-power transmission, and gear velocity (P = T*omega, P = F*v)"
  }),
  FIRST_LAW_THERMO: Object.freeze({
    id: "principle_first_law_thermo",
    name: "Energy Conservation & Heat Balance",
    description: "First law of thermodynamics, heat rates, and cycle work (Q = m*cp*dT, q = m*dh)"
  }),
  FLUID_MASS_CONTINUITY: Object.freeze({
    id: "principle_fluid_mass_continuity",
    name: "Mass Continuity & Flow Rates",
    description: "Conservation of mass, psychrometric mixing, and volumetric flow (sum m_in = sum m_out)"
  }),
  GEOMETRIC_COMPATIBILITY: Object.freeze({
    id: "principle_geometric_compatibility",
    name: "Geometry, Section Properties & Clearance",
    description: "Cross-sectional areas, section moduli, moments of inertia, and pitch geometry"
  }),
  EMPIRICAL_CORRELATION: Object.freeze({
    id: "principle_empirical_correlation",
    name: "Empirical & Machine Design Standards",
    description: "Empirical correlations, fatigue Marin factors, and ASME code standards"
  })
});

export const APPLICATIONS = Object.freeze({
  // Under FORCE_RESISTING_AREA
  DIRECT_SHEAR: Object.freeze({
    id: "app_direct_shear",
    principleId: "principle_force_resisting_area",
    name: "Direct & Transverse Shear"
  }),
  BEARING_STRESS: Object.freeze({
    id: "app_bearing_stress",
    principleId: "principle_force_resisting_area",
    name: "Bearing & Contact Stress"
  }),
  AXIAL_STRESS: Object.freeze({
    id: "app_axial_stress",
    principleId: "principle_force_resisting_area",
    name: "Axial Normal Stress"
  }),
  FLEXURAL_BENDING: Object.freeze({
    id: "app_flexural_bending",
    principleId: "principle_force_resisting_area",
    name: "Bending & Flexural Stress"
  }),
  TORSIONAL_SHEAR: Object.freeze({
    id: "app_torsional_shear",
    principleId: "principle_force_resisting_area",
    name: "Torsional Shear Stress"
  }),
  PRESSURE_VESSEL_STRESS: Object.freeze({
    id: "app_pressure_vessel_stress",
    principleId: "principle_force_resisting_area",
    name: "Pressure Vessel Wall Stress"
  }),
  COMBINED_MULTIAXIAL: Object.freeze({
    id: "app_combined_multiaxial",
    principleId: "principle_force_resisting_area",
    name: "Multiaxial Stress & Mohr Transformation"
  }),

  // Under CAPACITY_DEMAND_SAFETY
  STATIC_SAFETY_FACTOR: Object.freeze({
    id: "app_static_safety_factor",
    principleId: "principle_capacity_demand_safety",
    name: "Static Yield & Failure Criteria"
  }),
  FATIGUE_CRITERION: Object.freeze({
    id: "app_fatigue_criterion",
    principleId: "principle_capacity_demand_safety",
    name: "Fatigue & Marin Fluctuating Criteria"
  }),

  // Under CONSTITUTIVE_ELASTIC
  SPRING_RATE: Object.freeze({
    id: "app_spring_rate",
    principleId: "principle_constitutive_elastic",
    name: "Spring Rate & Elastic Stiffness"
  }),
  HOOKES_AXIAL_DEFLECTION: Object.freeze({
    id: "app_hookes_axial_deflection",
    principleId: "principle_constitutive_elastic",
    name: "Hooke's Law & Axial Deflection"
  }),
  TORSIONAL_TWIST: Object.freeze({
    id: "app_torsional_twist",
    principleId: "principle_constitutive_elastic",
    name: "Torsional Angular Twist & Rigidity"
  }),
  BEAM_DEFLECTION: Object.freeze({
    id: "app_beam_deflection",
    principleId: "principle_constitutive_elastic",
    name: "Beam Slope & Lateral Rigidity"
  }),

  // Under KINEMATIC_POWER
  ROTATIONAL_POWER: Object.freeze({
    id: "app_rotational_power",
    principleId: "principle_kinematic_power",
    name: "Rotational Power & Torque"
  }),
  GEAR_KINEMATICS: Object.freeze({
    id: "app_gear_kinematics",
    principleId: "principle_kinematic_power",
    name: "Gear Velocity & Speed Ratios"
  }),
  ENGINE_POWER_SPEED: Object.freeze({
    id: "app_engine_power_speed",
    principleId: "principle_kinematic_power",
    name: "Engine Power, MEP & Rotational Dynamics"
  }),

  // Under FIRST_LAW_THERMO
  SENSIBLE_HEAT: Object.freeze({
    id: "app_sensible_heat",
    principleId: "principle_first_law_thermo",
    name: "Sensible Heat Transfer Rate"
  }),
  ENTHALPY_COOLING: Object.freeze({
    id: "app_enthalpy_cooling",
    principleId: "principle_first_law_thermo",
    name: "Enthalpy Balance & Cooling Loads"
  }),
  CYCLE_WORK_EFFICIENCY: Object.freeze({
    id: "app_cycle_work_efficiency",
    principleId: "principle_first_law_thermo",
    name: "Cycle Heat, Work & Thermal Efficiency"
  }),

  // Under FLUID_MASS_CONTINUITY
  MASS_CONTINUITY: Object.freeze({
    id: "app_mass_continuity",
    principleId: "principle_fluid_mass_continuity",
    name: "Mass Continuity & Mixing Balance"
  }),
  VOLUMETRIC_FLOW: Object.freeze({
    id: "app_volumetric_flow",
    principleId: "principle_fluid_mass_continuity",
    name: "Volumetric Flow Rate & Density"
  }),

  // Under GEOMETRIC_COMPATIBILITY
  CROSS_SECTION_PROPS: Object.freeze({
    id: "app_cross_section_props",
    principleId: "principle_geometric_compatibility",
    name: "Cross-Section Area, Inertia & Section Modulus"
  }),
  SPRING_DIMENSIONS: Object.freeze({
    id: "app_spring_dimensions",
    principleId: "principle_geometric_compatibility",
    name: "Spring Coil Geometry, Pitch & Lengths"
  }),
  GEAR_DIMENSIONS: Object.freeze({
    id: "app_gear_dimensions",
    principleId: "principle_geometric_compatibility",
    name: "Gear Tooth Geometry, Module & Diameters"
  }),
  VESSEL_DIMENSIONS: Object.freeze({
    id: "app_vessel_dimensions",
    principleId: "principle_geometric_compatibility",
    name: "Pressure Vessel Radii & Wall Sizing"
  }),

  // Under EMPIRICAL_CORRELATION
  PSYCHROMETRIC_CORRELATIONS: Object.freeze({
    id: "app_psychrometric_correlations",
    principleId: "principle_empirical_correlation",
    name: "Psychrometric Vapor Correlations"
  }),
  MACHINERY_STANDARDS: Object.freeze({
    id: "app_machinery_standards",
    principleId: "principle_empirical_correlation",
    name: "Machinery Design Factors & Code Sizing"
  })
});

/**
 * Maps any relation to its governing principle and application.
 * Honors explicit declarations on the relation spec, with universal pattern
 * inference fallback to ensure infinite scalability across topics.
 */
export function inferRelationTaxonomy(rel = {}, topic = null) {
  if (rel.principle && rel.application) {
    const pId = typeof rel.principle === "object" ? rel.principle.id : rel.principle;
    const aId = typeof rel.application === "object" ? rel.application.id : rel.application;
    return { principleId: pId, applicationId: aId };
  }

  const id = (rel.id || rel.masteryId || "").toLowerCase();
  const name = (rel.name || "").toLowerCase();
  const formula = (rel.baseFormula || rel.formula || "").toLowerCase();
  const nodes = Array.isArray(rel.nodes) ? rel.nodes.map(n => String(n).toLowerCase()) : [];

  // 1. Safety Factor & Failure Criteria
  if (
    id.includes("safety_factor") || id.includes("fos") || id.includes("allowable") ||
    id.includes("nmss") || id.includes("nde") || id.includes("nsv") || id.includes("nbh") ||
    id.includes("rankine") || id.includes("coulomb_mohr") || id.includes("modified_mohr") ||
    name.includes("safety factor") || name.includes("allowable stress") ||
    nodes.some(n => n === "n_s" || n === "n_des" || n.startsWith("n_"))
  ) {
    if (id.includes("goodman") || id.includes("soderberg") || id.includes("gerber") || id.includes("marin") || id.includes("asme_elliptic") || id.includes("fat")) {
      return { principleId: PRINCIPLES.CAPACITY_DEMAND_SAFETY.id, applicationId: APPLICATIONS.FATIGUE_CRITERION.id };
    }
    return { principleId: PRINCIPLES.CAPACITY_DEMAND_SAFETY.id, applicationId: APPLICATIONS.STATIC_SAFETY_FACTOR.id };
  }

  // 2. Geometry: Cross-Section Properties (Area, Inertia, Section Modulus)
  if (
    id.includes("solid_area") || id.includes("shear_area") || id.includes("bearing_area") ||
    id.includes("net_area") || id.includes("tear_area") || id.includes("hollow_area") ||
    id.includes("solid_i") || id.includes("solid_j") || id.includes("solid_z") || id.includes("solid_zp") ||
    id.includes("section_modulus") || id.includes("rect_inertia") || id.includes("rect_z") ||
    id.includes("rect_q") || id.includes("parallel_axis") ||
    (nodes.includes("a") && (nodes.includes("d") || nodes.includes("b") || nodes.includes("h"))) ||
    (nodes.includes("z") && nodes.includes("m") && !id.includes("flexure"))
  ) {
    return { principleId: PRINCIPLES.GEOMETRIC_COMPATIBILITY.id, applicationId: APPLICATIONS.CROSS_SECTION_PROPS.id };
  }

  // 3. Force, Stress & Resisting Area
  if (id.includes("bearing_stress") || name.includes("bearing")) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.BEARING_STRESS.id };
  }
  if (id.includes("direct_shear") || id.includes("tear_stress") || id.includes("tau_avg") || id.includes("mid_shear")) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.DIRECT_SHEAR.id };
  }
  if (id.includes("torsion") || id.includes("polar") || id.includes("tau_1") || id.includes("tau_2")) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.TORSIONAL_SHEAR.id };
  }
  if (id.includes("flexure") || id.includes("bending") || id.includes("sigma_b")) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.FLEXURAL_BENDING.id };
  }
  if (id.includes("cyl_sigma") || id.includes("sph_sigma") || id.includes("sigma_h") || id.includes("sigma_l") || id.includes("lame")) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.PRESSURE_VESSEL_STRESS.id };
  }
  if (id.includes("von_mises") || id.includes("mohr") || id.includes("principal") || id.includes("sigma_vm") || id.includes("super_max") || id.includes("super_opp")) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.COMBINED_MULTIAXIAL.id };
  }
  if (nodes.some(n => n.startsWith("sigma") || n.startsWith("tau"))) {
    return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.AXIAL_STRESS.id };
  }

  // 4. Hooke's Law & Elastic Deformation
  if (id.includes("spring_rate") || id.includes("stiff") || id.includes("kpar") || id.includes("kser") || id.includes("element_rate")) {
    return { principleId: PRINCIPLES.CONSTITUTIVE_ELASTIC.id, applicationId: APPLICATIONS.SPRING_RATE.id };
  }
  if (id.includes("hookes") || id.includes("elastic_e") || id.includes("disp") || id.includes("strain") || id.includes("delta_j")) {
    return { principleId: PRINCIPLES.CONSTITUTIVE_ELASTIC.id, applicationId: APPLICATIONS.HOOKES_AXIAL_DEFLECTION.id };
  }
  if (id.includes("twist") || id.includes("theta")) {
    return { principleId: PRINCIPLES.CONSTITUTIVE_ELASTIC.id, applicationId: APPLICATIONS.TORSIONAL_TWIST.id };
  }
  if (id.includes("deflection") || id.includes("rigidity")) {
    return { principleId: PRINCIPLES.CONSTITUTIVE_ELASTIC.id, applicationId: APPLICATIONS.BEAM_DEFLECTION.id };
  }

  // 5. Kinematics & Power Transmission
  if (id.includes("power") || id.includes("torque") || id.includes("omega") || id.includes("belt_t")) {
    return { principleId: PRINCIPLES.KINEMATIC_POWER.id, applicationId: APPLICATIONS.ROTATIONAL_POWER.id };
  }
  if (id.includes("vr_") || id.includes("pitch_vel") || id.includes("wt_") || id.includes("gear")) {
    return { principleId: PRINCIPLES.KINEMATIC_POWER.id, applicationId: APPLICATIONS.GEAR_KINEMATICS.id };
  }
  if (id.includes("diesel_engine") || id.includes("mep") || id.includes("critical_speed") || id.includes("whirling") || id.includes("vibration")) {
    return { principleId: PRINCIPLES.KINEMATIC_POWER.id, applicationId: APPLICATIONS.ENGINE_POWER_SPEED.id };
  }

  // 6. Energy Conservation & Heat Balance (First Law)
  if (id.includes("heat_water") || id.includes("dhb_cw") || id.includes("diesel_qa") || id.includes("diesel_qr")) {
    return { principleId: PRINCIPLES.FIRST_LAW_THERMO.id, applicationId: APPLICATIONS.SENSIBLE_HEAT.id };
  }
  if (id.includes("cooling_load") || id.includes("heat_air") || id.includes("enthalpy_bal")) {
    return { principleId: PRINCIPLES.FIRST_LAW_THERMO.id, applicationId: APPLICATIONS.ENTHALPY_COOLING.id };
  }
  if (id.includes("diesel_wnet") || id.includes("eth_") || id.includes("efficiency") || id.includes("dhb_balance") || id.includes("pct_")) {
    return { principleId: PRINCIPLES.FIRST_LAW_THERMO.id, applicationId: APPLICATIONS.CYCLE_WORK_EFFICIENCY.id };
  }

  // 7. Fluid Continuity & Flow Rates
  if (id.includes("mass_balance") || id.includes("makeup") || id.includes("evap") || id.includes("drift") || id.includes("oa_fraction")) {
    return { principleId: PRINCIPLES.FLUID_MASS_CONTINUITY.id, applicationId: APPLICATIONS.MASS_CONTINUITY.id };
  }
  if (id.includes("air_vol") || id.includes("water_vol") || id.includes("vo") || id.includes("vm")) {
    return { principleId: PRINCIPLES.FLUID_MASS_CONTINUITY.id, applicationId: APPLICATIONS.VOLUMETRIC_FLOW.id };
  }

  // 8. Geometry: Springs, Gears, Vessels
  if (id.includes("spring_dm") || id.includes("spring_index") || id.includes("spring_fl") || id.includes("spring_solid_length")) {
    return { principleId: PRINCIPLES.GEOMETRIC_COMPATIBILITY.id, applicationId: APPLICATIONS.SPRING_DIMENSIONS.id };
  }
  if (id.includes("module_def") || id.includes("dp1") || id.includes("dp2") || id.includes("center_dist") || id.includes("addendum") || id.includes("root_diameter")) {
    return { principleId: PRINCIPLES.GEOMETRIC_COMPATIBILITY.id, applicationId: APPLICATIONS.GEAR_DIMENSIONS.id };
  }
  if (id.includes("di_ri") || id.includes("do_ro") || id.includes("ro_ri_t") || id.includes("do_di_t") || id.includes("dm") || id.includes("tnom")) {
    return { principleId: PRINCIPLES.GEOMETRIC_COMPATIBILITY.id, applicationId: APPLICATIONS.VESSEL_DIMENSIONS.id };
  }

  // 9. Empirical Correlations & Codes
  if (id.includes("psat") || id.includes("pwb") || id.includes("pv_dp") || id.includes("carrier") || id.includes("humidity_ratio") || id.includes("relative_humidity") || id.includes("air_enthalpy") || id.includes("specific_volume")) {
    return { principleId: PRINCIPLES.EMPIRICAL_CORRELATION.id, applicationId: APPLICATIONS.PSYCHROMETRIC_CORRELATIONS.id };
  }
  if (id.includes("asme") || id.includes("marin") || id.includes("buckingham") || id.includes("lewis")) {
    return { principleId: PRINCIPLES.EMPIRICAL_CORRELATION.id, applicationId: APPLICATIONS.MACHINERY_STANDARDS.id };
  }

  // Fallback to topic category / subject
  const subj = (topic?.subject || "").toLowerCase();
  if (subj.includes("air conditioning")) {
    return { principleId: PRINCIPLES.FIRST_LAW_THERMO.id, applicationId: APPLICATIONS.SENSIBLE_HEAT.id };
  }
  if (subj.includes("powerplant")) {
    return { principleId: PRINCIPLES.FIRST_LAW_THERMO.id, applicationId: APPLICATIONS.CYCLE_WORK_EFFICIENCY.id };
  }
  return { principleId: PRINCIPLES.FORCE_RESISTING_AREA.id, applicationId: APPLICATIONS.AXIAL_STRESS.id };
}

/**
 * Returns the resolved taxonomy for a relation or step object.
 */
export function getRelationTaxonomy(rel = {}, topic = null) {
  if (!rel) return null;
  return inferRelationTaxonomy(rel, topic);
}
