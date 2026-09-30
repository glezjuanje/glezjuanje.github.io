import { getCollection, type CollectionEntry } from 'astro:content';
import readingTime from 'reading-time';
import { CATEGORIES } from '../config/site';

export type Post = CollectionEntry<'blog'>;

/** Artículos publicados, del más reciente al más antiguo. En desarrollo se ven también los borradores. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function categorySlug(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.slug ?? slugify(name);
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;
export const categoryUrl = (name: string) => `/blog/categoria/${categorySlug(name)}/`;
export const tagUrl = (tag: string) => `/blog/etiqueta/${slugify(tag)}/`;

/** Minutos de lectura aproximados, ignorando imports, JSX y fórmulas. */
export function readingMinutes(body = ''): number {
  const text = body
    .replace(/^import .*$/gm, '')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`|[\]()-]/g, ' ');
  return Math.max(1, Math.round(readingTime(text, { wordsPerMinute: 220 }).minutes));
}

/** Relacionados: 2 puntos por etiqueta compartida, 1 por misma categoría; desempate por fecha. */
export function relatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const tags = new Set(current.data.tags.map(slugify));
  return all
    .filter((p) => p.id !== current.id)
    .map((p) => ({
      post: p,
      score:
        p.data.tags.filter((t) => tags.has(slugify(t))).length * 2 +
        (p.data.category === current.data.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.post.data.date.valueOf() - a.post.data.date.valueOf())
    .slice(0, limit)
    .map((x) => x.post);
}

/** Todas las etiquetas con su nombre visible (el primero que aparece) y número de artículos. */
export function allTags(posts: Post[]): { name: string; slug: string; count: number }[] {
  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const p of posts) {
    for (const t of p.data.tags) {
      const slug = slugify(t);
      const entry = map.get(slug) ?? { name: t, slug, count: 0 };
      entry.count++;
      map.set(slug, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
}

const dateFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (d: Date) => dateFmt.format(d);

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
/** Fecha al estilo de los partes antiguos: 24·IX·2026 */
export const formatShortDate = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, '0')}·${ROMAN_MONTHS[d.getUTCMonth()]}·${d.getUTCFullYear()}`;

/**
 * Número de boletín de cada artículo publicado, en orden cronológico (el
 * primero es el Nº 001). Los borradores no tienen número.
 */
export async function getPostNumbers(): Promise<Map<string, string>> {
  const published = (await getPosts()).filter((p) => !p.data.draft).reverse();
  return new Map(published.map((p, i) => [p.id, String(i + 1).padStart(3, '0')]));
}
