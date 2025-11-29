import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("goals")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    deadline: v.optional(v.number()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("goals", {
      userId,
      ...args,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("goals"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found or unauthorized");

    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteGoal = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found or unauthorized");

    await ctx.db.delete(args.id);
  },
});
