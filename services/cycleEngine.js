const getCycleDay = (lastMenstruationDate) => {
  if (!lastMenstruationDate) return null;

  const today = new Date();
  const last = new Date(lastMenstruationDate);

  return Math.floor((today - last) / (1000 * 60 * 60 * 24));
};

const getPhase = (day, flags = []) => {
  // 🔥 PRIORIDAD ABSOLUTA → Amenorrhea
  if (flags.includes("Amenorrhea risk")) {
    return "no_cycle";
  }

  if (!day) return "unknown";

  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "luteal";
};

const getLatestLog = (logs = []) => {
  if (!logs?.length) return null;
  return logs[logs.length - 1];
};

const detectEnergyAvailability = (log) => {
  if (!log) return 3;

  const score = (log.energy + log.sleep + log.performance) / 3 - log.fatigue;

  return Math.max(1, Math.min(5, Math.round(score)));
};

const detectFlags = ({ day, cycleLength, log }) => {
  const flags = [];

  // 🔴 Irregular cycle
  if (!cycleLength || cycleLength > 35) {
    flags.push("Irregular cycle");
  }

  // 🔴 Amenorrhea REAL (NO 60 días → mínimo 90 días clínico)
  if (day && day >= 90) {
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

  // 🔥 PRIORIDAD ABSOLUTA → Amenorrhea
  if (flags.includes("Amenorrhea risk")) {
    training.push("Avoid high intensity training");
    nutrition.push("Ensure sufficient energy intake");
    nutrition.push("Increase total calories and reduce deficits");

    return { training, nutrition };
  }

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

    default:
      training.push("Maintain light to moderate activity");
      nutrition.push("Focus on balanced nutrition");
      break;
  }

  // 🔴 Overrides secundarios
  if (flags.includes("Low energy availability")) {
    training.unshift("Reduce training load immediately");
    nutrition.unshift("Increase caloric intake");
  }

  return { training, nutrition };
};

exports.buildInsights = (cycle) => {
  const day = getCycleDay(cycle?.lastMenstruationDate);

  const latestLog = getLatestLog(cycle?.dailyLogs);

  const energyScore = detectEnergyAvailability(latestLog);

  const flags = detectFlags({
    day,
    cycleLength: cycle?.cycleLength,
    log: latestLog,
  });

  // 🔥 IMPORTANTE → phase después de flags
  const phase = getPhase(day, flags);

  const recommendations = getRecommendations(phase, flags);

  return {
    currentPhase: phase,
    dayOfCycle: day,
    cycleHealthScore:
      cycle?.cycleLength >= 24 && cycle?.cycleLength <= 35 ? 4 : 2,
    energyAvailabilityScore: energyScore,
    riskFlags: flags,
    recommendations,
  };
};
