import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

// A bullet is either a plain string or a list of segments. A string segment is
// literal text; an object segment renders as an ArrowLink (`em` italicizes it).
const segment = z.union([
  z.string(),
  z.object({
    text: z.string(),
    href: z.string().optional(),
    em: z.boolean().optional(),
  }),
]);
const bullet = z.union([z.string(), z.array(segment)]);

const positions = defineCollection({
  loader: file("src/content/positions.yaml"),
  schema: z.object({
    id: z.string(),
    section: z.enum(["experience", "education", "research"]),
    org: z.string(),
    from: z.coerce.date(),
    to: z.union([z.coerce.date(), z.literal("Present")]),
    positions: z.array(
      z.object({
        role: z.string().optional(),
        bullets: z.array(bullet),
      }),
    ),
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
