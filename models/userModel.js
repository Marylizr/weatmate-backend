const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FemaleProfileSchema = new Schema(
  {
    // Stage / context (high value for trainer planning)
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

    // Contraception / hormonal context
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

    // Cycle baseline (stable-ish, optional)
    cycleBaseline: {
      regularity: {
        type: String,
        enum: ["unknown", "regular", "irregular"],
        default: "unknown",
      },
      typicalCycleLengthDays: { type: Number, default: null },
      typicalBleedDays: { type: Number, default: null },
      lastKnownLMP: { type: Date, default: null }, // optional
      trackingMethod: {
        type: String,
        enum: ["none", "calendar", "btt", "app", "ovulation_tests", "other"],
        default: "none",
      },
    },

    // Symptoms that affect training readiness/recovery
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

    // Menopause/perimenopause specifics
    menopause: {
      hotFlashes: { type: Boolean, default: false },
      nightSweats: { type: Boolean, default: false },
      vaginalDryness: { type: Boolean, default: false },
      sleepDisturbance: { type: Boolean, default: false },
      jointPain: { type: Boolean, default: false },
      notes: { type: String, default: "" },
    },

    // Pregnancy/postpartum specifics
    pregnancyPostpartum: {
      isPregnant: { type: Boolean, default: false },
      dueDate: { type: Date, default: null },
      postpartumWeeks: { type: Number, default: null },
      pelvicFloorSymptoms: { type: Boolean, default: false },
      breastfeeding: { type: Boolean, default: false },
      notes: { type: String, default: "" },
    },

    // RED-S / LEA / Amenorrhea questionnaire + derived flags
    energyAvailability: {
      // Inputs
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

      // Cycle disturbance indicators
      missedPeriods3PlusMonths: { type: Boolean, default: false },
      cyclesPerYear: { type: Number, default: null },

      notes: { type: String, default: "" },

      // Derived flags (calculated in controller)
      flags: {
        redS_risk: { type: Boolean, default: false },
        lea_risk: { type: Boolean, default: false },
        amenorrhea_risk: { type: Boolean, default: false },
        lastCalculatedAt: { type: Date, default: null },
        rationale: { type: String, default: "" },
      },
    },

    // Trainer-only notes (if you want this hidden from client UI)
    trainerOnlyNotes: { type: String, default: "" },

    // Metadata
    lastUpdatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    image: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    }, // Email verification status

    emailToken: {
      type: String,
    }, // Token for email confirmation

    password: {
      type: String,
      required: [true, "Password is required"],
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    age: {
      type: Number,
      min: [15, "You must be at least 15 years old"],
    },
    height: {
      type: Number,
      min: [0, "Height must be a positive number"],
    },
    weight: {
      type: Number,
      min: [0, "Weight must be a positive number"],
    },
    goal: {
      type: String,
    },
    role: {
      type: String,
      default: "basic",
      enum: ["basic", "admin", "personal-trainer"],
    },
    token: String,
    gender: {
      type: String,
      enum: ["female", "male"],
      required: [true, "Gender is required"],
    },
    fitness_level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },

    medicalHistory: [
      {
        history: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],

    preferences: [
      {
        preference: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],

    sessionNotes: [
      {
        note: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    nutritionHistory: [
      {
        date: { type: Date, default: Date.now },
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fats: { type: Number, required: true },
        goal: {
          type: String,
          enum: ["maintenance", "fat-loss", "muscle-gain"],
          required: true,
        },
      },
    ],

    // Reference to the personal trainer
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Admin / personal trainer -specific fields
    degree: {
      type: String,
    },
    experience: {
      type: Number,
    },
    specializations: {
      type: String,
    },
    bio: {
      type: String,
    },
    location: {
      type: String,
    },

    // NEW: femaleProfile embedded in user (no new collections)
    femaleProfile: {
      type: FemaleProfileSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
