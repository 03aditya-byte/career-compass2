import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("careerPaths").collect();
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const careers = await ctx.db.query("careerPaths").collect();
    return Array.from(new Set(careers.map((career) => career.category)));
  },
});

export const listSaved = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const savedRows = await ctx.db
      .query("savedCareers")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const detailed = [];
    for (const saved of savedRows) {
      const career = await ctx.db.get(saved.careerPathId);
      if (career) {
        detailed.push({
          savedCareerId: saved._id,
          career,
        });
      }
    }
    return detailed;
  },
});

export const toggleSave = mutation({
  args: { careerPathId: v.id("careerPaths") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("savedCareers")
      .withIndex("by_user_id_and_career_path_id", (q) =>
        q.eq("userId", userId).eq("careerPathId", args.careerPathId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { status: "removed" as const };
    }

    await ctx.db.insert("savedCareers", {
      userId,
      careerPathId: args.careerPathId,
    });
    return { status: "saved" as const };
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("careerPaths").first();
    if (existing) return;

    const paths = [
      {
        title: "Frontend Developer",
        description: "Build responsive user interfaces with performance-first thinking.",
        requiredSkills: ["React", "TypeScript", "CSS", "Testing"],
        estimatedSalary: "$80k - $140k",
        growthOutlook: "High",
        difficulty: "Entry-Mid",
        category: "Technology",
        skillsToGrow: ["UX storytelling", "Accessibility", "Design systems"],
      },
      {
        title: "Product Manager",
        description: "Coordinate product vision, customer insights, and delivery teams.",
        requiredSkills: ["Strategy", "Communication", "Analytics", "Agile"],
        estimatedSalary: "$100k - $160k",
        growthOutlook: "Stable",
        difficulty: "Mid-Senior",
        category: "Product",
        skillsToGrow: ["Experimentation", "Executive storytelling", "Roadmapping"],
      },
      {
        title: "Data Scientist",
        description: "Translate complex datasets into business insights and ML models.",
        requiredSkills: ["Python", "SQL", "Statistics", "Machine Learning"],
        estimatedSalary: "$110k - $180k",
        growthOutlook: "High",
        difficulty: "Mid-Senior",
        category: "Data",
        skillsToGrow: ["MLOps", "Prompt engineering", "Experiment design"],
      },
      {
        title: "UX Designer",
        description: "Design human-centered experiences backed by research.",
        requiredSkills: ["Figma", "User Research", "Prototyping", "Information Architecture"],
        estimatedSalary: "$75k - $130k",
        growthOutlook: "High",
        difficulty: "Entry-Mid",
        category: "Design",
        skillsToGrow: ["Design systems", "Motion design", "Workshop facilitation"],
      },
    ];

    for (const path of paths) {
      await ctx.db.insert("careerPaths", path);
    }
  },
});