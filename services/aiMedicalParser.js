const OpenAI = require("openai");
const { z } = require("zod");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================
// CONTROLLED VALUES
// =============================
const ALLOWED_SEVERITIES = ["normal", "low", "moderate", "high"];

const ALLOWED_FLAGS = [
  "high_glucose",
  "low_glucose",
  "high_hba1c",
  "insulin_resistance_risk",
  "diabetes_risk",
  "high_ldl",
  "low_hdl",
  "high_triglycerides",
  "high_cholesterol",
  "dyslipidemia",
  "low_iron",
  "low_ferritin",
  "anemia_risk",
  "b12_deficiency_risk",
  "folate_deficiency_risk",
  "thyroid_issue",
  "hypothyroid_pattern",
  "hyperthyroid_pattern",
  "high_crp",
  "inflammation",
  "low_vitamin_d",
  "liver_stress",
  "kidney_stress",
  "electrolyte_imbalance",
  "hypertension",
  "obesity",
  "celiac_disease",
  "gluten_sensitivity",
  "pcos_risk",
  "hormonal_imbalance",
  "low_energy_availability_risk",
];

// =============================
// SCHEMA
// =============================
const ConditionSchema = z.object({
  name: z.string().default(""),
  value: z.string().default(""),
  normalRange: z.string().optional().default(""),
  severity: z.enum(["normal", "low", "moderate", "high"]).default("normal"),
  recommendation: z.string().optional().default(""),
  flag: z.string().optional().default(""),
});

const OutputSchema = z.object({
  summary: z.string().default(""),
  conditions: z.array(ConditionSchema).default([]),
  flags: z.array(z.string()).default([]),
});

// =============================
// CLEAN TEXT
// =============================
const cleanText = (txt = "") =>
  String(txt)
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim()
    .slice(0, 12000);

// =============================
// SANITIZE AI OUTPUT
// =============================
const normalizeSeverity = (severity) => {
  if (!severity || typeof severity !== "string") return "normal";

  const value = severity.trim().toLowerCase();

  if (ALLOWED_SEVERITIES.includes(value)) return value;

  if (value === "mild") return "low";
  if (value === "medium") return "moderate";
  if (value === "severe") return "high";

  return "normal";
};

const normalizeFlag = (flag) => {
  if (!flag || typeof flag !== "string") return "";

  const value = flag.trim().toLowerCase();

  return ALLOWED_FLAGS.includes(value) ? value : "";
};

const sanitizeParsedOutput = (parsed = {}) => {
  const rawConditions = Array.isArray(parsed.conditions)
    ? parsed.conditions
    : [];

  const conditions = rawConditions.map((condition) => {
    const severity = normalizeSeverity(condition.severity);
    const flag = severity === "normal" ? "" : normalizeFlag(condition.flag);

    return {
      name: String(condition.name || ""),
      value: String(condition.value || ""),
      normalRange: String(condition.normalRange || ""),
      severity,
      recommendation: String(condition.recommendation || ""),
      flag,
    };
  });

  const conditionFlags = conditions
    .map((condition) => condition.flag)
    .filter(Boolean);

  const rawFlags = Array.isArray(parsed.flags) ? parsed.flags : [];

  const flags = [
    ...new Set(
      [...rawFlags.map(normalizeFlag), ...conditionFlags].filter(Boolean),
    ),
  ];

  return {
    summary: String(parsed.summary || ""),
    conditions,
    flags,
  };
};

// =============================
// PROMPT
// =============================
const buildPrompt = (text) => `
You are a strict clinical lab data parser for a fitness, nutrition, and training app.

Return ONLY valid JSON. Do not include markdown. Do not include explanations outside JSON.

Detect and evaluate, when present:

1. Glucose / metabolic markers:
- fasting glucose
- random glucose
- HbA1c
- fasting insulin
- HOMA-IR
- C-peptide

2. Lipid profile:
- total cholesterol
- LDL
- HDL
- triglycerides
- non-HDL cholesterol
- ApoB
- Lipoprotein(a)

3. Thyroid markers:
- TSH
- free T3
- free T4
- total T3
- total T4
- reverse T3
- TPO antibodies
- thyroglobulin antibodies

4. Iron / anemia markers:
- serum iron
- ferritin
- transferrin
- transferrin saturation
- TIBC
- hemoglobin
- hematocrit
- MCV
- MCH
- RDW
- B12
- folate

5. Inflammation / immune markers:
- CRP
- hs-CRP
- ESR
- white blood cells
- neutrophils
- lymphocytes
- platelets

6. Liver markers:
- ALT
- AST
- GGT
- ALP
- bilirubin
- albumin

7. Kidney / hydration markers:
- creatinine
- eGFR
- urea
- BUN
- uric acid
- sodium
- potassium
- chloride

8. Vitamins / minerals:
- vitamin D
- magnesium
- calcium
- zinc
- selenium

9. Hormonal / reproductive markers:
- estradiol
- progesterone
- testosterone
- free testosterone
- SHBG
- LH
- FSH
- prolactin
- DHEA-S
- cortisol

10. Fitness-relevant risk indicators:
- anemia risk
- insulin resistance risk
- diabetes risk
- dyslipidemia
- hypothyroid pattern
- hyperthyroid pattern
- inflammation
- liver stress
- kidney stress
- low vitamin D
- low iron stores
- possible RED-S / low energy availability indicators when clearly supported by the text

Severity rules:
- Use "normal" when the marker is within range and does not require action.
- Use "low" for mild abnormality or low clinical concern.
- Use "moderate" for relevant abnormality that may affect nutrition/training.
- Use "high" for clearly important abnormality or higher-risk finding.
- Do not create a flag for normal values.
- Only create a flag if the value is clearly abnormal, clinically relevant, or explicitly diagnosed in the text.
- If reference ranges are present, use them.
- If reference ranges are missing, be cautious and avoid overdiagnosis.
- Never diagnose. Use terms like "risk", "pattern", or "possible" when appropriate.

Allowed flags only:
${ALLOWED_FLAGS.map((flag) => `- ${flag}`).join("\n")}

JSON FORMAT EXACTLY:

{
  "summary": "",
  "conditions": [
    {
      "name": "",
      "value": "",
      "normalRange": "",
      "severity": "normal",
      "recommendation": "",
      "flag": ""
    }
  ],
  "flags": []
}

If no relevant data is detected, return:

{
  "summary": "No relevant medical data detected.",
  "conditions": [],
  "flags": []
}

TEXT:
${text}
`;

// =============================
// SAFE JSON PARSE
// =============================
const safeJsonParse = (content = "") => {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

// =============================
// MAIN PARSER
// =============================
const parseMedicalText = async (rawText) => {
  const text = cleanText(rawText);

  if (!text || text.length < 20) {
    return {
      summary: "No readable medical data detected.",
      conditions: [],
      flags: [],
      raw: "",
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a strict medical JSON parser. Return only valid JSON.",
        },
        {
          role: "user",
          content: buildPrompt(text),
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(content);

    if (!parsed) {
      return {
        summary: "Could not parse medical analysis.",
        conditions: [],
        flags: [],
        raw: content,
      };
    }

    const sanitized = sanitizeParsedOutput(parsed);
    const validated = OutputSchema.safeParse(sanitized);

    if (!validated.success) {
      return {
        summary: sanitized.summary || "Partial analysis.",
        conditions: sanitized.conditions || [],
        flags: sanitized.flags || [],
        raw: content,
      };
    }

    return {
      summary: validated.data.summary,
      conditions: validated.data.conditions,
      flags: validated.data.flags,
      raw: content,
    };
  } catch (error) {
    console.error("Medical AI error:", error);

    return {
      summary: "AI processing failed.",
      conditions: [],
      flags: [],
      raw: "",
    };
  }
};

module.exports = { parseMedicalText };
