import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_NAMES } from './config/site';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      // Nº del artículo (del nombre del archivo en articulos/). Si falta, se numera por fecha.
      number: z.number().int().positive().optional(),
      updated: z.coerce.date().optional(),
      description: z.string().max(200),
      category: z.enum(CATEGORY_NAMES),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
