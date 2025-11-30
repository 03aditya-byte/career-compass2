import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    profiles: defineTable({
      userId: v.id("users"),
      headline: v.optional(v.string()),
      bio: v.optional(v.string()),
      skills: v.array(v.string()),
      interests: v.array(v.string()),
      currentRole: v.optional(v.string()),
      targetRole: v.optional(v.string()),
      experienceYears: v.optional(v.number()),
    }).index("by_user_id", ["userId"]),

    careerPaths: defineTable({
      title: v.string(),
      description: v.string(),
      requiredSkills: v.array(v.string()),
      estimatedSalary: v.string(),
      growthOutlook: v.string(), // e.g., "High", "Stable"
      difficulty: v.string(), // e.g., "Entry", "Mid", "Senior"
      category: v.string(),
      skillsToGrow: v.array(v.string()),
    }),

    goals: defineTable({
      userId: v.id("users"),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
      deadline: v.optional(v.number()),
      category: v.string(), // e.g., "Learning", "Networking", "Job Search"
    }).index("by_user_id", ["userId"]),

    resources: defineTable({
      title: v.string(),
      type: v.union(v.literal("course"), v.literal("article"), v.literal("video"), v.literal("tool")),
      url: v.string(),
      tags: v.array(v.string()),
      description: v.optional(v.string()),
    }).searchIndex("search_title", {
      searchField: "title",
      filterFields: ["type"],
    }),
    counselors: defineTable({
      name: v.string(),
      specialization: v.string(),
      bio: v.string(),
      experienceYears: v.number(),
      rating: v.number(),
      focusAreas: v.array(v.string()),
      availability: v.array(v.string()),
    }),
    mentorships: defineTable({
      userId: v.id("users"),
      counselorId: v.id("counselors"),
      sessionDate: v.number(),
      goal: v.string(),
      status: v.union(v.literal("scheduled"), v.literal("completed"), v.literal("cancelled")),
      notes: v.optional(v.string()),
    }).index("by_user_id", ["userId"]),
    savedCareers: defineTable({
      userId: v.id("users"),
      careerPathId: v.id("careerPaths"),
    })
      .index("by_user_id", ["userId"])
      .index("by_user_id_and_career_path_id", ["userId", "careerPathId"]),
    assessments: defineTable({
      userId: v.id("users"),
      interests: v.array(v.string()),
      strengths: v.array(v.string()),
      focusAreas: v.array(v.string()),
      recommendedCareers: v.array(v.string()),
      confidenceScore: v.number(),
      summary: v.string(),
    }).index("by_user_id", ["userId"]),

    feedback: defineTable({
      userId: v.id("users"),
      rating: v.number(),
      mood: v.string(),
      category: v.string(),
      message: v.string(),
    })
      .index("by_user_id", ["userId"])
      .index("by_category", ["category"]),

  },
  {
    schemaValidation: false,
  },
);

export default schema;