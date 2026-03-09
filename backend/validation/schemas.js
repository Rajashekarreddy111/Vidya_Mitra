const { z } = require("zod");

const uuidSchema = z.string().uuid("Invalid id format");

const authSchemas = {
  register: z.object({
    body: z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
      email: z.string().trim().email("Valid email is required"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/\d/, "Password must include a number")
        .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Password must include a special character"),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  verifyOtp: z.object({
    body: z.object({
      email: z.string().trim().email("Valid email is required"),
      otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  login: z.object({
    body: z.object({
      email: z.string().trim().email("Valid email is required"),
      password: z.string().min(1, "Password is required"),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  forgotPassword: z.object({
    body: z.object({
      email: z.string().trim().email("Valid email is required"),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  resetPassword: z.object({
    body: z.object({
      email: z.string().trim().email("Valid email is required"),
      otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/\d/, "Password must include a number")
        .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Password must include a special character"),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  updateProfile: z.object({
    body: z
      .object({
        name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
        profilePhoto: z.string().trim().max(2000000).optional(),
        profile_photo: z.string().trim().max(2000000).optional(),
      })
      .refine((data) => data.name !== undefined || data.profilePhoto !== undefined || data.profile_photo !== undefined, {
        message: "At least one profile field is required",
      }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
};

const roadmapSchemas = {
  generate: z.object({
    body: z.object({
      jobRole: z.string().trim().min(2, "jobRole is required").max(120),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  updateTopic: z.object({
    body: z.object({
      isCompleted: z.boolean(),
    }),
    params: z.object({
      topicId: uuidSchema,
    }),
    query: z.object({}).optional().default({}),
  }),
};

const quizSchemas = {
  generate: z.object({
    body: z.object({
      topic: z.string().trim().min(2, "topic is required").max(120),
      numQuestions: z.number().int().min(3).max(15).optional().default(5),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  evaluate: z.object({
    body: z.object({
      quizId: uuidSchema,
      answers: z.array(z.union([z.string(), z.object({ questionIndex: z.number().int().optional(), index: z.number().int().optional(), selectedAnswer: z.string().optional(), answer: z.string().optional() })])).min(1),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
};

const interviewSchemas = {
  generate: z.object({
    body: z.object({
      jobRole: z.string().trim().min(2).max(120),
      type: z.enum(["technical", "soft-skill"]).optional().default("technical"),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
  evaluate: z.object({
    body: z.object({
      interviewId: uuidSchema,
      answers: z
        .array(
          z.union([
            z.string(),
            z.object({
              questionIndex: z.number().int().optional(),
              answer: z.string().optional(),
            }),
          ])
        )
        .min(1),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
};

const youtubeSchemas = {
  search: z.object({
    body: z.object({}).optional().default({}),
    params: z.object({}).optional().default({}),
    query: z.object({
      topic: z.string().trim().min(2, "topic query is required").max(150),
    }),
  }),
};

const companyPreparationSchemas = {
  search: z.object({
    body: z.object({
      companyName: z.string().trim().min(2, "companyName is required").max(120),
    }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
  }),
};

module.exports = {
  authSchemas,
  roadmapSchemas,
  quizSchemas,
  interviewSchemas,
  youtubeSchemas,
  companyPreparationSchemas,
};
