import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config/site';
import { getPosts, postUrl } from '../utils/posts';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((p) => !p.data.draft);
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    customData: `<language>es-es</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: [post.data.category, ...post.data.tags],
      author: SITE.email,
    })),
  });
}
