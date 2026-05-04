const FLAG_MAP = {
  glucose: "diabetes",
  insulin: "diabetes",
  hba1c: "diabetes",

  tsh: "hypothyroidism",
  t3: "thyroid",
  t4: "thyroid",

  iron: "low_iron",
  ferritin: "low_iron",

  cholesterol: "cardiovascular",
};

const mapConditionsToFlags = (conditions = []) => {
  const flags = new Set();

  conditions.forEach((c) => {
    const key = c.name.toLowerCase();

    Object.keys(FLAG_MAP).forEach((k) => {
      if (key.includes(k)) {
        flags.add(FLAG_MAP[k]);
      }
    });

    if (c.severity === "high") {
      flags.add("high_risk");
    }
  });

  return Array.from(flags);
};

module.exports = { mapConditionsToFlags };
