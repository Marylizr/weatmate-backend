const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ==============================
// FEMALE PROFILE (NO TOCAR)
// ==============================
const FemaleProfileSchema = new Schema(
  {
    lifeStage: {
      type: String,
      enum: [
        "not_applicable",
        "unknown",
        "cycling",
        "pregnancy",
        "postpartum",
        "perimenopause",
        "menopause",
      ],
      default: "unknown",
    },

    contraception: {
      usesContraception: { type: Boolean, default: false },
      type: {
        type: String,
        enum: [
          "none",
          "combined_pill",
          "progestin_only_pill",
          "iud_hormonal",
          "iud_copper",
          "implant",
          "injection",
          "ring",
          "patch",
          "other",
        ],
        default: "none",
      },
      notes: { type: String, default: "" },
    },

    cycleBaseline: {
      regularity: {
        type: String,
        enum: ["unknown", "regular", "irregular"],
        default: "unknown",
      },
      typicalCycleLengthDays: { type: Number, default: null },
      typicalBleedDays: { type: Number, default: null },
      lastKnownLMP: { type: Date, default: null },
      trackingMethod: {
        type: String,
        enum: ["none", "calendar", "btt", "app", "ovulation_tests", "other"],
        default: "none",
      },
    },

    symptoms: {
      dysmenorrhea: {
        has: { type: Boolean, default: false },
        severity0to10: { type: Number, default: null, min: 0, max: 10 },
        notes: { type: String, default: "" },
      },
      pmsPmdd: {
        has: { type: Boolean, default: false },
        severity0to10: { type: Number, default: null, min: 0, max: 10 },
        notes: { type: String, default: "" },
      },
      heavyBleeding: {
        has: { type: Boolean, default: false },
        notes: { type: String, default: "" },
      },
      spotting: { type: Boolean, default: false },
      migraines: { type: Boolean, default: false },
      giSymptoms: { type: Boolean, default: false },
      sleepIssues: { type: Boolean, default: false },
      moodIssues: { type: Boolean, default: false },
    },

    menopause: {
      hotFlashes: { type: Boolean, default: false },
      nightSweats: { type: Boolean, default: false },
      vaginalDryness: { type: Boolean, default: false },
      sleepDisturbance: { type: Boolean, default: false },
      jointPain: { type: Boolean, default: false },
      notes: { type: String, default: "" },
    },

    pregnancyPostpartum: {
      isPregnant: { type: Boolean, default: false },
      dueDate: { type: Date, default: null },
      postpartumWeeks: { type: Number, default: null },
      pelvicFloorSymptoms: { type: Boolean, default: false },
      breastfeeding: { type: Boolean, default: false },
      notes: { type: String, default: "" },
    },

    energyAvailability: {
      recentWeightLoss: { type: Boolean, default: false },
      restrictiveDieting: { type: Boolean, default: false },
      fearOfWeightGain: { type: Boolean, default: false },
      lowEnergy: { type: Boolean, default: false },
      lowLibido: { type: Boolean, default: false },
      frequentIllness: { type: Boolean, default: false },
      coldIntolerance: { type: Boolean, default: false },
      hairLoss: { type: Boolean, default: false },
      stressFractureHistory: { type: Boolean, default: false },
      injuryFrequencyHigh: { type: Boolean, default: false },

      missedPeriods3PlusMonths: { type: Boolean, default: false },
      cyclesPerYear: { type: Number, default: null },

      notes: { type: String, default: "" },

      flags: {
        redS_risk: { type: Boolean, default: false },
        lea_risk: { type: Boolean, default: false },
        amenorrhea_risk: { type: Boolean, default: false },
        lastCalculatedAt: { type: Date, default: null },
        rationale: { type: String, default: "" },
      },
    },

    cycleData: { type: Object, default: {} },
    lastMoodEntry: { type: Date, default: null },
    trainerOnlyNotes: { type: String, default: "" },
    lastUpdatedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ==============================
// USER MODEL
// ==============================
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    image: String,

    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    isVerified: { type: Boolean, default: false },
    emailToken: String,

    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    age: Number,
    height: Number,
    weight: Number,
    goal: String,

    role: {
      type: String,
      default: "basic",
      enum: ["basic", "admin", "personal-trainer"],
    },

    token: String,

    gender: {
      type: String,
      enum: ["female", "male"],
      default: "female",
    },

    fitness_level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "very_active", "athlete"],
      default: "light",
    },

    // ==============================
    // NUTRITION (FIXED)
    // ==============================
    nutritionProfile: {
      dietType: {
        type: String,
        enum: ["standard", "vegetarian", "vegan", "keto", "gluten-free"],
        default: "standard",
      },

      //  ahora dinámico
      intolerances: [{ type: String }],

      allergies: [{ type: String }],

      dislikes: [String],
    },

    // ==============================
    //  HEALTH FLAGS (FIXED)
    // ==============================

    medicalFlags: [
      {
        type: String,
      },
    ],

    medicalHistory: [
      {
        history: {
          type: String,
          default: "",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        pdfUrl: {
          type: String,
          default: "",
        },
        analysis: {
          summary: {
            type: String,
            default: "",
          },
          conditions: [
            {
              name: {
                type: String,
                default: "",
              },
              value: {
                type: String,
                default: "",
              },
              normalRange: {
                type: String,
                default: "",
              },
              severity: {
                type: String,
                enum: ["normal", "low", "moderate", "high", ""],
                default: "",
              },
              recommendation: {
                type: String,
                default: "",
              },
            },
          ],
          flags: [
            {
              type: String,
            },
          ],
        },
      },
    ],
    ///// INJURIES /////
    injuryProfile: {
      hasActiveInjury: {
        type: Boolean,
        default: false,
      },
      injuries: [
        {
          area: {
            type: String,
            enum: [
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
            ],
            default: "other",
          },
          side: {
            type: String,
            enum: ["left", "right", "both", "unknown"],
            default: "unknown",
          },
          status: {
            type: String,
            enum: ["active", "recovering", "resolved"],
            default: "active",
          },
          severity: {
            type: String,
            enum: ["low", "moderate", "high"],
            default: "moderate",
          },
          notes: {
            type: String,
            default: "",
          },
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    /////////accessibility /////////////
    accessibilityProfile: {
      hasReducedMobility: {
        type: Boolean,
        default: false,
      },

      hasDisability: {
        type: Boolean,
        default: false,
      },

      disabilityTypes: [
        {
          type: String,
          enum: [
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
          ],
        },
      ],

      mobilityLimitations: [
        {
          type: String,
          enum: [
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
          ],
        },
      ],

      assistiveDevices: [
        {
          type: String,
          enum: [
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
          ],
        },
      ],

      trainingAdaptations: [
        {
          type: String,
          enum: [
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
          ],
        },
      ],

      notes: {
        type: String,
        default: "",
      },
    },

    preferences: [
      {
        preference: String,
        date: { type: Date, default: Date.now },
      },
    ],

    sessionNotes: [
      {
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],

    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    degree: String,
    experience: Number,

    specializations: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    bio: String,
    location: String,

    femaleProfile: {
      type: FemaleProfileSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
