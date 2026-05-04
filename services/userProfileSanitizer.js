// services/userProfileSanitizer.js

const safeObj = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

const safeString = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  return value.trim();
};

const safeStringArray = (value = []) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const allowedFitnessLevels = ["beginner", "intermediate", "advanced"];

const allowedActivityLevels = [
  "sedentary",
  "light",
  "moderate",
  "very_active",
  "athlete",
];

const allowedRoles = ["basic", "admin", "personal-trainer"];

const allowedGender = ["female", "male"];

const allowedInjuryAreas = [
  "neck",
  "shoulder",
  "elbow",
  "wrist",
  "back",
  "lower_back",
  "hip",
  "knee",
  "ankle",
  "foot",
  "other",
];

const allowedInjurySides = ["left", "right", "both", "unknown"];
const allowedInjuryStatuses = ["active", "recovering", "resolved"];
const allowedInjurySeverities = ["low", "moderate", "high"];

const allowedDisabilityTypes = [
  "motor",
  "visual",
  "hearing",
  "cognitive",
  "neurological",
  "intellectual",
  "respiratory",
  "cardiovascular_limitation",
  "chronic_pain",
  "other",
];

const allowedMobilityLimitations = [
  "walking",
  "stairs",
  "standing_long_periods",
  "balance",
  "range_of_motion",
  "upper_body",
  "lower_body",
  "grip",
  "coordination",
  "floor_transitions",
  "other",
];

const allowedAssistiveDevices = [
  "none",
  "cane",
  "walker",
  "wheelchair",
  "crutches",
  "orthotic",
  "prosthetic",
  "hearing_aid",
  "glasses",
  "other",
];

const allowedTrainingAdaptations = [
  "seated_exercises",
  "low_impact",
  "machine_based",
  "avoid_floor_work",
  "extra_rest",
  "balance_support",
  "reduced_range_of_motion",
  "avoid_jumping",
  "avoid_running",
  "avoid_overhead",
  "supervision_required",
  "clear_visual_cues",
  "clear_audio_cues",
  "simple_instructions",
  "other",
];

const filterAllowed = (values = [], allowed = []) => {
  return safeStringArray(values).filter((item) => allowed.includes(item));
};

const normalizeSpecializations = (specializations) => {
  return safeStringArray(specializations);
};

const sanitizeInjuryProfile = (incoming = {}) => {
  const profile = safeObj(incoming);

  const injuries = Array.isArray(profile.injuries)
    ? profile.injuries.map((injury) => {
        const item = safeObj(injury);

        return {
          area: allowedInjuryAreas.includes(item.area) ? item.area : "other",
          side: allowedInjurySides.includes(item.side) ? item.side : "unknown",
          status: allowedInjuryStatuses.includes(item.status)
            ? item.status
            : "active",
          severity: allowedInjurySeverities.includes(item.severity)
            ? item.severity
            : "moderate",
          notes: safeString(item.notes),
          date: item.date ? new Date(item.date) : new Date(),
        };
      })
    : [];

  const hasActiveInjury =
    typeof profile.hasActiveInjury === "boolean"
      ? profile.hasActiveInjury
      : injuries.some((injury) => injury.status === "active");

  return {
    hasActiveInjury,
    injuries,
  };
};

const sanitizeAccessibilityProfile = (incoming = {}) => {
  const profile = safeObj(incoming);

  let assistiveDevices = filterAllowed(
    profile.assistiveDevices,
    allowedAssistiveDevices,
  );

  if (assistiveDevices.includes("none") && assistiveDevices.length > 1) {
    assistiveDevices = assistiveDevices.filter((item) => item !== "none");
  }

  return {
    hasReducedMobility: !!profile.hasReducedMobility,
    hasDisability: !!profile.hasDisability,

    disabilityTypes: filterAllowed(
      profile.disabilityTypes,
      allowedDisabilityTypes,
    ),

    mobilityLimitations: filterAllowed(
      profile.mobilityLimitations,
      allowedMobilityLimitations,
    ),

    assistiveDevices,

    trainingAdaptations: filterAllowed(
      profile.trainingAdaptations,
      allowedTrainingAdaptations,
    ),

    notes: safeString(profile.notes),
  };
};

const buildHealthFlagsFromProfiles = ({
  medicalFlags = [],
  injuryProfile,
  accessibilityProfile,
}) => {
  const flags = new Set(Array.isArray(medicalFlags) ? medicalFlags : []);

  if (injuryProfile?.hasActiveInjury) {
    flags.add("injury_risk");
  }

  if (accessibilityProfile?.hasReducedMobility) {
    flags.add("reduced_mobility");
  }

  if (accessibilityProfile?.hasDisability) {
    flags.add("special_needs");
    flags.add("adapted_training_required");
  }

  if (accessibilityProfile?.assistiveDevices?.includes("wheelchair")) {
    flags.add("uses_wheelchair");
    flags.add("adapted_training_required");
  }

  if (
    Array.isArray(accessibilityProfile?.assistiveDevices) &&
    accessibilityProfile.assistiveDevices.some((item) => item !== "none")
  ) {
    flags.add("uses_assistive_device");
  }

  if (accessibilityProfile?.mobilityLimitations?.includes("balance")) {
    flags.add("balance_limitation");
  }

  if (accessibilityProfile?.disabilityTypes?.includes("visual")) {
    flags.add("visual_impairment");
  }

  if (accessibilityProfile?.disabilityTypes?.includes("hearing")) {
    flags.add("hearing_impairment");
  }

  if (
    accessibilityProfile?.disabilityTypes?.includes("cognitive") ||
    accessibilityProfile?.disabilityTypes?.includes("intellectual")
  ) {
    flags.add("cognitive_support_needed");
  }

  if (accessibilityProfile?.disabilityTypes?.includes("neurological")) {
    flags.add("neurological_condition");
  }

  if (accessibilityProfile?.disabilityTypes?.includes("chronic_pain")) {
    flags.add("chronic_pain");
  }

  return [...flags].filter(Boolean);
};

module.exports = {
  safeObj,
  safeString,
  safeStringArray,

  allowedFitnessLevels,
  allowedActivityLevels,
  allowedRoles,
  allowedGender,

  normalizeSpecializations,
  sanitizeInjuryProfile,
  sanitizeAccessibilityProfile,
  buildHealthFlagsFromProfiles,
};
