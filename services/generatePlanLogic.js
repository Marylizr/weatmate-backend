// utils/generatePlanLogic.js

const formatFlag = (flag) => {
  if (!flag || typeof flag !== "string") return "";

  return flag.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const hasAnyFlag = (flags = [], targets = []) => {
  return targets.some((target) => flags.includes(target));
};

const getGoalStrategy = (goal = "") => {
  const normalizedGoal = String(goal || "").toLowerCase();

  if (
    normalizedGoal === "fat-lost" ||
    normalizedGoal === "fat_loss" ||
    normalizedGoal === "fat loss" ||
    normalizedGoal === "fat-loss"
  ) {
    return {
      goalType: "fat_loss",
      strategy:
        "Use a controlled calorie deficit, prioritize protein, fiber, satiety, and adherence. Avoid extreme restriction.",
      nutritionFocus: [
        "Protein consistency",
        "High-fiber carbohydrates",
        "Meal structure",
        "Hunger control",
        "Sustainable deficit",
      ],
      trainingFocus: [
        "Progressive strength training",
        "Low-to-moderate cardio",
        "Recovery monitoring",
      ],
    };
  }

  if (
    normalizedGoal === "gain-muscle-mass" ||
    normalizedGoal === "muscle_gain" ||
    normalizedGoal === "muscle gain" ||
    normalizedGoal === "muscle-gain"
  ) {
    return {
      goalType: "muscle_gain",
      strategy:
        "Use a moderate calorie surplus, prioritize progressive overload, sufficient carbohydrates, and recovery.",
      nutritionFocus: [
        "Adequate calories",
        "Protein distribution",
        "Training fuel",
        "Recovery support",
      ],
      trainingFocus: [
        "Progressive overload",
        "Hypertrophy volume",
        "Performance tracking",
      ],
    };
  }

  if (
    normalizedGoal === "maintenance" ||
    normalizedGoal === "maintain" ||
    normalizedGoal === "recomposition"
  ) {
    return {
      goalType: "maintenance",
      strategy:
        "Use maintenance or slight deficit depending on body composition goal. Prioritize consistency and performance.",
      nutritionFocus: [
        "Stable intake",
        "Protein consistency",
        "Meal quality",
        "Performance support",
      ],
      trainingFocus: [
        "Strength progression",
        "Movement quality",
        "Recovery balance",
      ],
    };
  }

  return {
    goalType: "general",
    strategy:
      "Use a balanced nutrition plan aligned with the client's profile, preferences, medical flags, and training load.",
    nutritionFocus: ["Balanced intake", "Adherence", "Food quality"],
    trainingFocus: ["Consistency", "Progressive training", "Recovery"],
  };
};

const getClinicalStrategy = (user = {}) => {
  const flags = Array.isArray(user.medicalFlags) ? user.medicalFlags : [];
  const nutritionProfile = user.nutritionProfile || {};

  const warnings = [];
  const restrictions = [];
  const nutritionActions = [];
  const trainingActions = [];
  const monitoring = [];

  if (
    hasAnyFlag(flags, [
      "obesity",
      "insulin_resistance_risk",
      "high_glucose",
      "high_hba1c",
      "diabetes_risk",
    ])
  ) {
    nutritionActions.push(
      "Prioritize high-fiber carbohydrates and distribute carbohydrates across meals.",
    );
    nutritionActions.push(
      "Avoid large high-glycemic carbohydrate spikes, especially in low-activity windows.",
    );
    nutritionActions.push(
      "Keep protein consistent across the day to support satiety and lean mass.",
    );

    trainingActions.push(
      "Include regular low-to-moderate cardio to support glucose management.",
    );
    trainingActions.push(
      "Use progressive strength training without excessive fatigue accumulation.",
    );

    monitoring.push(
      "Monitor weight trend, waist measurements, hunger, energy, and glucose-related markers when available.",
    );
  }

  if (
    hasAnyFlag(flags, [
      "hypertension",
      "cardiovascular",
      "dyslipidemia",
      "high_ldl",
      "low_hdl",
      "high_triglycerides",
      "high_cholesterol",
    ])
  ) {
    nutritionActions.push(
      "Prioritize unsaturated fats, omega-3 rich foods, soluble fiber, and minimally processed foods.",
    );
    nutritionActions.push(
      "Keep sodium intake controlled when hypertension is present.",
    );

    trainingActions.push(
      "Avoid sudden high-intensity spikes if blood pressure or cardiovascular risk is present.",
    );
    trainingActions.push(
      "Progress cardio gradually and monitor perceived exertion.",
    );

    monitoring.push(
      "Monitor blood pressure, lipid markers, perceived exertion, and recovery.",
    );
  }

  if (
    hasAnyFlag(flags, ["celiac_disease", "gluten_sensitivity"]) ||
    nutritionProfile.dietType === "gluten-free"
  ) {
    restrictions.push("Gluten-free meal planning required.");
    restrictions.push(
      "Avoid wheat, barley, rye, and cross-contamination risk when celiac disease is present.",
    );

    nutritionActions.push(
      "Use gluten-free carbohydrate sources such as rice, potatoes, quinoa, oats certified gluten-free, fruits, and legumes if tolerated.",
    );
  }

  if (
    hasAnyFlag(flags, [
      "low_iron",
      "low_ferritin",
      "anemia_risk",
      "b12_deficiency_risk",
      "folate_deficiency_risk",
    ])
  ) {
    nutritionActions.push(
      "Prioritize iron-rich foods, B12, folate, and vitamin C pairing when appropriate.",
    );

    trainingActions.push(
      "Reduce high-fatigue blocks until energy and iron-related markers improve.",
    );

    monitoring.push(
      "Monitor fatigue, shortness of breath, recovery, ferritin, hemoglobin, B12, and folate when available.",
    );
  }

  if (
    hasAnyFlag(flags, [
      "thyroid_issue",
      "hypothyroid_pattern",
      "hyperthyroid_pattern",
      "Hashimoto",
    ])
  ) {
    nutritionActions.push(
      "Avoid aggressive calorie deficits and prioritize consistent energy availability.",
    );

    trainingActions.push(
      "Use moderate training volume and monitor fatigue, sleep, and recovery.",
    );

    monitoring.push(
      "Monitor fatigue, cold intolerance, sleep, weight trend, TSH, free T3, free T4, and antibodies when available.",
    );
  }

  if (
    hasAnyFlag(flags, [
      "high_crp",
      "inflammation",
      "liver_stress",
      "kidney_stress",
      "electrolyte_imbalance",
    ])
  ) {
    nutritionActions.push(
      "Prioritize whole foods, hydration, micronutrient density, and recovery-supportive meals.",
    );

    trainingActions.push(
      "Avoid excessive fatigue accumulation and adjust intensity based on readiness.",
    );

    monitoring.push(
      "Monitor inflammatory markers, liver/kidney markers, hydration, sleep, and training response.",
    );
  }

  if (Array.isArray(nutritionProfile.intolerances)) {
    nutritionProfile.intolerances.forEach((item) => {
      restrictions.push(`Avoid intolerance trigger: ${item}.`);
    });
  }

  if (Array.isArray(nutritionProfile.allergies)) {
    nutritionProfile.allergies.forEach((item) => {
      restrictions.push(`Avoid allergy trigger: ${item}.`);
    });
  }

  if (Array.isArray(nutritionProfile.dislikes)) {
    nutritionProfile.dislikes.forEach((item) => {
      restrictions.push(`Avoid disliked food when possible: ${item}.`);
    });
  }

  flags.forEach((flag) => {
    if (!flag) return;
    warnings.push(formatFlag(flag));
  });

  return {
    warnings: [...new Set(warnings)].filter(Boolean),
    restrictions: [...new Set(restrictions)].filter(Boolean),
    nutritionActions: [...new Set(nutritionActions)].filter(Boolean),
    trainingActions: [...new Set(trainingActions)].filter(Boolean),
    monitoring: [...new Set(monitoring)].filter(Boolean),
  };
};

const generatePlanLogic = (user = {}) => {
  const goalStrategy = getGoalStrategy(user.goal);
  const clinicalStrategy = getClinicalStrategy(user);

  return {
    context: {
      generatedAt: new Date(),

      clientSnapshot: {
        userId: user._id || user.id || null,
        name: user.name || "",
        age: user.age || null,
        gender: user.gender || "",
        height: user.height || null,
        weight: user.weight || null,
        goal: user.goal || "",
        fitness_level: user.fitness_level || "",
        activityLevel: user.activityLevel || "light",
      },

      goal: goalStrategy,

      clinical: clinicalStrategy,

      summary: {
        mainGoal: goalStrategy.goalType,
        primaryNutritionFocus: goalStrategy.nutritionFocus,
        primaryTrainingFocus: goalStrategy.trainingFocus,
        activeRestrictions: clinicalStrategy.restrictions,
        activeWarnings: clinicalStrategy.warnings,
      },
    },
  };
};

module.exports = {
  generatePlanLogic,
};
