// services/nutritionEngine.js

const ACTIVITY_LEVELS = {
  sedentary: {
    factor: 1.2,
    label: "Sedentary",
    description: "Little to no structured exercise",
  },
  light: {
    factor: 1.375,
    label: "Light",
    description: "Light training 1-3 times per week",
  },
  moderate: {
    factor: 1.55,
    label: "Moderate",
    description: "Training 3-5 times per week",
  },
  very_active: {
    factor: 1.75,
    label: "Very active",
    description: "Hard training around 6 times per week",
  },
  athlete: {
    factor: 1.9,
    label: "Athlete",
    description: "High-volume training or athletic workload",
  },
};

const normalizeGoal = (goal = "") => {
  const value = String(goal || "")
    .trim()
    .toLowerCase();

  if (
    value === "fat-lost" ||
    value === "fat_loss" ||
    value === "fat loss" ||
    value === "fat-loss"
  ) {
    return "fat_loss";
  }

  if (
    value === "gain-muscle-mass" ||
    value === "muscle_gain" ||
    value === "muscle gain" ||
    value === "muscle-gain"
  ) {
    return "muscle_gain";
  }

  if (
    value === "maintenance" ||
    value === "maintain" ||
    value === "recomposition"
  ) {
    return "recomposition";
  }

  return "recomposition";
};

const getActivityData = (activityLevel = "light") => {
  return ACTIVITY_LEVELS[activityLevel] || ACTIVITY_LEVELS.light;
};

const hasAnyFlag = (flags = [], targets = []) => {
  return targets.some((target) => flags.includes(target));
};

const calculateBMR = ({ weight, height, age, gender }) => {
  if (gender === "female") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }

  return 10 * weight + 6.25 * height - 5 * age + 5;
};

const calculateCalories = ({ tdee, goal, flags = [], gender }) => {
  let multiplier = 1;

  if (goal === "fat_loss") {
    multiplier = 0.85;
  }

  if (goal === "muscle_gain") {
    multiplier = 1.08;
  }

  if (goal === "recomposition") {
    multiplier = 0.95;
  }

  if (hasAnyFlag(flags, ["obesity"])) {
    multiplier -= 0.02;
  }

  if (
    hasAnyFlag(flags, [
      "insulin_resistance_risk",
      "high_glucose",
      "high_hba1c",
      "diabetes_risk",
    ])
  ) {
    multiplier -= 0.01;
  }

  if (
    hasAnyFlag(flags, [
      "thyroid_issue",
      "hypothyroid_pattern",
      "low_energy_availability_risk",
      "low_iron",
      "low_ferritin",
      "anemia_risk",
    ])
  ) {
    multiplier = Math.max(multiplier, 0.88);
  }

  const minCalories = gender === "female" ? 1400 : 1600;

  return Math.max(Math.round(tdee * multiplier), minCalories);
};

const calculateMacroTargets = ({ calories, weight, goal, flags = [] }) => {
  let proteinPerKg = 2.0;
  let fatPerKg = 0.8;

  if (goal === "fat_loss") {
    proteinPerKg = 2.0;
    fatPerKg = 0.75;
  }

  if (goal === "recomposition") {
    proteinPerKg = 2.2;
    fatPerKg = 0.8;
  }

  if (goal === "muscle_gain") {
    proteinPerKg = 1.8;
    fatPerKg = 0.9;
  }

  if (
    hasAnyFlag(flags, ["obesity", "insulin_resistance_risk", "diabetes_risk"])
  ) {
    proteinPerKg = Math.max(proteinPerKg, 2.0);
    fatPerKg = Math.max(fatPerKg, 0.75);
  }

  if (hasAnyFlag(flags, ["low_energy_availability_risk", "thyroid_issue"])) {
    fatPerKg = Math.max(fatPerKg, 0.85);
  }

  const protein = Math.round(weight * proteinPerKg);
  const fats = Math.round(weight * fatPerKg);

  const caloriesFromProtein = protein * 4;
  const caloriesFromFats = fats * 9;

  const carbs = Math.max(
    0,
    Math.round((calories - caloriesFromProtein - caloriesFromFats) / 4),
  );

  const fiber = Math.round((calories / 1000) * 14);

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fats,
    fiber,
  };
};

const buildNutritionProfile = (user) => {
  if (!user) return null;

  const weight = Number(user.weight);
  const height = Number(user.height);
  const age = Number(user.age);
  const gender = user.gender;

  if (!weight || !height || !age || !gender) {
    return null;
  }

  const goal = normalizeGoal(user.goal);
  const flags = Array.isArray(user.medicalFlags) ? user.medicalFlags : [];

  const bmr = calculateBMR({
    weight,
    height,
    age,
    gender,
  });

  const activityData = getActivityData(user.activityLevel);
  const tdee = bmr * activityData.factor;

  const calories = calculateCalories({
    tdee,
    goal,
    flags,
    gender,
  });

  const macros = calculateMacroTargets({
    calories,
    weight,
    goal,
    flags,
  });

  return {
    calories: macros.calories,

    macros: {
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
      fiber: macros.fiber,
    },

    meta: {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedTdee: macros.calories,
      goal,
      activityLevel: user.activityLevel || "light",
      activityFactor: activityData.factor,
      activityLabel: activityData.label,
      activityDescription: activityData.description,
    },

    weight,
    goal,
    flags,
  };
};

module.exports = {
  buildNutritionProfile,
  calculateCalories,
  calculateMacroTargets,
  getActivityData,
  normalizeGoal,
};
