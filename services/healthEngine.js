// backend/utils/healthEngine.js

const DEFAULTS = {
  calorieAdjustment: 0,
  macroAdjustments: {
    protein: 0,
    carbs: 0,
    fats: 0,
  },
  trainingAdjustments: {
    volumeMultiplier: 1,
    intensityCap: 10,
    avoidExercises: [],
  },
  alerts: [],
};

const FLAG_RULES = {
  high_glucose: (state) => {
    state.macroAdjustments.carbs -= 0.2;
    state.macroAdjustments.protein += 0.1;

    state.trainingAdjustments.volumeMultiplier += 0.1;
    state.trainingAdjustments.intensityCap = Math.min(
      state.trainingAdjustments.intensityCap,
      8,
    );

    state.alerts.push("Reduce carb spikes");
  },

  hypertension: (state) => {
    state.trainingAdjustments.intensityCap = Math.min(
      state.trainingAdjustments.intensityCap,
      7,
    );

    state.trainingAdjustments.volumeMultiplier -= 0.1;

    state.alerts.push("Avoid high intensity peaks");
  },

  thyroid_issue: (state) => {
    state.calorieAdjustment += 0.1;
    state.trainingAdjustments.volumeMultiplier -= 0.1;

    state.alerts.push("Avoid aggressive deficit");
  },

  low_iron: (state) => {
    state.trainingAdjustments.volumeMultiplier -= 0.2;
    state.trainingAdjustments.intensityCap = Math.min(
      state.trainingAdjustments.intensityCap,
      7,
    );

    state.alerts.push("Reduce fatigue");
  },
};

const normalizeState = (state) => {
  state.trainingAdjustments.volumeMultiplier = Math.max(
    0.5,
    Math.min(1.5, state.trainingAdjustments.volumeMultiplier),
  );

  state.trainingAdjustments.intensityCap = Math.max(
    5,
    Math.min(10, state.trainingAdjustments.intensityCap),
  );

  return state;
};

const buildHealthPlan = ({ medicalFlags = [], goal, fitness_level }) => {
  let state = JSON.parse(JSON.stringify(DEFAULTS));

  medicalFlags.forEach((flag) => {
    const rule = FLAG_RULES[flag];
    if (rule) rule(state);
  });

  if (goal === "fat_loss") state.calorieAdjustment -= 0.1;

  if (fitness_level === "beginner") {
    state.trainingAdjustments.volumeMultiplier *= 0.9;
    state.trainingAdjustments.intensityCap = Math.min(
      state.trainingAdjustments.intensityCap,
      7,
    );
  }

  if (fitness_level === "advanced") {
    state.trainingAdjustments.volumeMultiplier *= 1.05;
  }

  return normalizeState(state);
};

module.exports = {
  buildHealthPlan,
};
