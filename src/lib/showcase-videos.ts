import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { postUrl, type BlogPost } from './relations';
import type { Lang } from './tags';

/**
 * Unified video list for the home showcase.
 *
 * Two sources feed the section, newest first:
 *   1. The `videos` collection — weekly summary videos that have no blog post
 *      of their own. They may declare `shorts` and an optional `relatedPost`.
 *   2. Blog posts that embed a video via `youtubeId` (legacy 1:1 behavior).
 *
 * An entry resolves to its related post URL when that post exists in the
 * same language; otherwise it falls back to the YouTube watch URL.
 */
export interface ShowcaseVideo {
	youtubeId: string;
	date: Date;
	title: string;
	description: string;
	href: string;
	external: boolean;
	shorts: string[];
	lang: Lang;
}

export async function getShowcaseVideos(
	allPosts: readonly CollectionEntry<'blog'>[],
	lang: Lang,
	basePath: string,
): Promise<ShowcaseVideo[]> {
	const weekly = (await getCollection('videos'))
		.filter((entry) => !entry.data.draft && entry.data.lang === lang)
		.map((entry): ShowcaseVideo => {
			const related = entry.data.relatedPost
				? allPosts.find((post) => post.id === entry.data.relatedPost && post.data.lang === lang)
				: undefined;
			return {
				youtubeId: entry.data.youtubeId,
				date: entry.data.date,
				title: entry.data.title,
				description: entry.data.description,
				href: related
					? postUrl(related, basePath)
					: `https://www.youtube.com/watch?v=${entry.data.youtubeId}`,
				external: !related,
				shorts: entry.data.shorts,
				lang,
			};
		});

	const fromPosts = allPosts
		.filter((post: BlogPost) => !post.data.draft && post.data.lang === lang && Boolean(post.data.youtubeId))
		.map((post: BlogPost): ShowcaseVideo => ({
			youtubeId: post.data.youtubeId!,
			date: post.data.date,
			title: post.data.title,
			description: post.data.description,
			href: postUrl(post, basePath),
			external: false,
			shorts: [],
			lang,
		}));

	return [...weekly, ...fromPosts].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
