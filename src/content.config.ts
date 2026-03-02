import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const positions = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/positions" }),
  schema: z.object({
    section: z.enum(["experience", "education", "research"]),
    org: z.string(),
    from: z.coerce.date(),
    to: z.coerce.date(),
    role: z.string().optional(),
  }),
});

const skills = defineCollection({
  loader: file("src/content/skills.yaml"),
  schema: z.object({
    id: z.string(),
    category: z.string(),
    items: z.array(z.string()),
  }),
});

export const collections = { positions, skills };
