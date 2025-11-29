import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("careerPaths").collect();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("careerPaths").first();
    if (existing) return; // Already seeded

    const paths = [
      {
        title: "Frontend Developer",
        description: "Build user interfaces and web applications using modern frameworks.",
        requiredSkills: ["React", "TypeScript", "CSS", "HTML"],
        estimatedSalary: "$80k - $140k",
        growthOutlook: "High",
        difficulty: "Entry-Mid",
      },
      {
        title: "Backend Engineer",
        description: "Design and implement server-side logic and database architectures.",
        requiredSkills: ["Node.js", "Python", "SQL", "System Design"],
        estimatedSalary: "$90k - $150k",
        growthOutlook: "High",
        difficulty: "Mid-Senior",
      },
      {
        title: "Product Manager",
        description: "Lead product strategy and coordinate between engineering, design, and business.",
        requiredSkills: ["Strategy", "Communication", "Agile", "Analytics"],
        estimatedSalary: "$100k - $160k",
        growthOutlook: "Stable",
        difficulty: "Mid-Senior",
      },
      {
        title: "UX Designer",
        description: "Design intuitive and accessible user experiences for digital products.",
        requiredSkills: ["Figma", "User Research", "Prototyping", "UI Design"],
        estimatedSalary: "$75k - $130k",
        growthOutlook: "High",
        difficulty: "Entry-Mid",
      },
    ];

    for (const path of paths) {
      await ctx.db.insert("careerPaths", path);
    }
  },
});
