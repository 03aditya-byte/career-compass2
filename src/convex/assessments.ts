import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("assessments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
  },
});

export const submit = mutation({
  args: {
    interests: v.array(v.string()),
    strengths: v.array(v.string()),
    focusAreas: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedStrengths = args.strengths.map((s) => s.toLowerCase());
    const normalizedFocus = args.focusAreas.map((s) => s.toLowerCase());
    const normalizedInterests = args.interests.map((s) => s.toLowerCase());

    const careers = await ctx.db.query("careerPaths").collect();

    const scored = careers
      .map((career) => {
        const requiredMatch = career.requiredSkills.filter((skill) =>
          normalizedStrengths.includes(skill.toLowerCase()),
        ).length;
        const futureMatch = career.skillsToGrow.filter((skill) =>
          normalizedFocus.includes(skill.toLowerCase()),
        ).length;
        const categoryBoost = normalizedInterests.some((interest) =>
          interest.includes(career.category.toLowerCase()),
        )
          ? 2
          : 0;
        const score = requiredMatch * 2 + futureMatch + categoryBoost;
        return { career, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const recommendedCareers = scored.filter((entry) => entry.score > 0).map((entry) => entry.career.title);
    const totalScore = scored.reduce((sum, entry) => sum + entry.score, 0);
    const confidenceScore = recommendedCareers.length
      ? Math.min(Math.max(totalScore * 10, 35), 100)
      : 25;

    const summary =
      recommendedCareers.length > 0
        ? `Based on your strengths in ${args.strengths.join(", ")} and interests in ${args.interests.join(
            ", ",
          )}, we recommend exploring ${recommendedCareers.join(", ")}.`
        : "We stored your preferences. Add more specific strengths or interests to unlock tailored paths.";

    await ctx.db.insert("assessments", {
      userId,
      interests: args.interests,
      strengths: args.strengths,
      focusAreas: args.focusAreas,
      recommendedCareers,
      confidenceScore,
      summary,
    });

    return { recommendedCareers, confidenceScore, summary };
  },
});
