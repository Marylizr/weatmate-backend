export const buildNutritionProfile = (user) => {
  if (!user) return null;

  const weight = Number(user.weight);
  const height = Number(user.height);
  const age = Number(user.age);
  const gender = user.gender;

  if (!weight || !height || !age) return null;

  const goalMap = {
    "Fat-Lost": "fat_loss",
    "Gain-Muscle-Mass": "muscle_gain",
    Maintenance: "recomposition",
  };

  const goal = goalMap[user.goal] || "recomposition";

  const BMR =
    gender === "female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

  const activity = user.activityLevel || 1.4;
  const TDEE = BMR * activity;

  return {
    weight,
    goal,
    flags: user.medicalFlags || [],
    BMR: Math.round(BMR),
    TDEE: Math.round(TDEE),
  };
};
