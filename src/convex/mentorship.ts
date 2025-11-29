import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listCounselors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("counselors").collect();
  },
});

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("mentorshipSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const enriched = [];
    for (const session of sessions) {
      const counselor = await ctx.db.get(session.counselorId);
      enriched.push({ session, counselor });
    }
    return enriched;
  },
});

export const bookSession = mutation({
  args: {
    counselorId: v.id("counselors"),
    sessionDate: v.number(),
    goal: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.sessionDate <= Date.now()) {
      throw new Error("Pick a future date");
    }

    const trimmedGoal = args.goal.trim();
    if (!trimmedGoal) {
      throw new Error("Add a session goal");
    }

    await ctx.db.insert("mentorshipSessions", {
      userId,
      counselorId: args.counselorId,
      sessionDate: args.sessionDate,
      goal: trimmedGoal,
      status: "scheduled",
    });
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const existing = await ctx.db.query("counselors").first();
    if (existing) return;

    const counselors = [
      {
        name: "Ananya Rao",
        specialization: "Product Strategy",
        bio: "Former FAANG PM mentoring students on product sense and leadership.",
        experienceYears: 8,
        rating: 4.9,
        focusAreas: ["Product", "Leadership", "Interviews"],
        availability: ["Tue 6 PM", "Thu 8 PM", "Sat 10 AM"],
      },
      {
        name: "Leon Chen",
        specialization: "Data Science",
        bio: "ML lead helping grads transition into high-impact applied science roles.",
        experienceYears: 10,
        rating: 4.8,
        focusAreas: ["Data", "AI", "Research"],
        availability: ["Mon 7 PM", "Wed 9 PM", "Sun 11 AM"],
      },
      {
        name: "Sara Velasquez",
        specialization: "Design & Research",
        bio: "UX director focused on storytelling portfolios and systems thinking.",
        experienceYears: 11,
        rating: 5,
        focusAreas: ["Design", "Storytelling", "Interviews"],
        availability: ["Fri 5 PM", "Sat 1 PM", "Sun 9 AM"],
      },
    ];

    for (const counselor of counselors) {
      await ctx.db.insert("counselors", counselor);
    }
  },
});