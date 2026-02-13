import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const saveGeneratedContent = mutationGeneric({
  args: {
    sourceAction: v.union(
      v.literal("generate"),
      v.literal("convert_blog_to_thread"),
      v.literal("convert_thread_to_blog")
    ),
    sourceFormat: v.union(v.literal("blog"), v.literal("thread")),
    productName: v.string(),
    productLink: v.string(),
    referenceTitle: v.optional(v.string()),
    referenceContext: v.optional(v.string()),
    targetTitle: v.optional(v.string()),
    targetDescription: v.optional(v.string()),
    tone: v.string(),
    titles: v.array(v.string()),
    content: v.string(),
    hashtags: v.array(v.string()),
    threads: v.array(v.string()),
  },
  returns: v.id("generatedContents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedContents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
