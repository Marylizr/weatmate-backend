const getCycleDay = (lastMenstruationDate) => {
  if (!lastMenstruationDate) return null;

  const today = new Date();
  const last = new Date(lastMenstruationDate);

  return Math.floor((today - last) / (1000 * 60 * 60 * 24));
};

const getPhase = (day) => {
  if (!day) return "unknown";

  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "luteal";
};

const getLatestLog = (logs = []) => {
  if (!logs.length) return null;
  return logs[logs.length - 1];
};

const detectEnergyAvailability = (log) => {
  if (!log) return 3;

  const score = (log.energy + log.sleep + log.performance) / 3 - log.fatigue;

  return Math.max(1, Math.min(5, Math.round(score)));
};

const detectFlags = ({ day, cycleLength, log }) => {
  const flags = [];

  if (!cycleLength || cycleLength > 35) {
    flags.push("Irregular cycle");
  }

  if (day && day > 60) {
    flags.push("Amenorrhea risk");
  }

  if (log) {
    if (log.energy <= 2 && log.performance <= 2) {
      flags.push("Low energy availability");
    }

    if (log.fatigue >= 4 && log.sleep <= 2) {
      flags.push("Poor recovery state");
    }
  }

  return flags;
};

const getRecommendations = (phase, flags) => {
  const training = [];
  const nutrition = [];

  switch (phase) {
    case "menstrual":
      training.push("Low intensity training or rest");
      nutrition.push("Increase iron intake and hydration");
      break;

    case "follicular":
      training.push("Focus on strength and progressive overload");
      nutrition.push("Higher carbs to support performance");
      break;

    case "ovulation":
      training.push("High intensity and peak performance sessions");
      nutrition.push("Optimize performance fueling");
      break;

    case "luteal":
      training.push("Moderate volume and controlled intensity");
      nutrition.push("Stabilize blood sugar and reduce cravings");
      break;
  }

  // override si hay flags
  if (flags.includes("Low energy availability")) {
    training.unshift("Reduce training load immediately");
    nutrition.unshift("Increase caloric intake");
  }

  if (flags.includes("Amenorrhea risk")) {
    training.unshift("Avoid high intensity training");
    nutrition.unshift("Ensure sufficient energy intake");
  }

  return { training, nutrition };
};

exports.buildInsights = (cycle) => {
  const day = getCycleDay(cycle.lastMenstruationDate);
  const phase = getPhase(day);

  const latestLog = getLatestLog(cycle.dailyLogs);

  const energyScore = detectEnergyAvailability(latestLog);

  const flags = detectFlags({
    day,
    cycleLength: cycle.cycleLength,
    log: latestLog,
  });

  const recommendations = getRecommendations(phase, flags);

  return {
    currentPhase: phase,
    dayOfCycle: day,
    cycleHealthScore:
      cycle.cycleLength >= 24 && cycle.cycleLength <= 35 ? 4 : 2,
    energyAvailabilityScore: energyScore,
    riskFlags: flags,
    recommendations,
  };
};
