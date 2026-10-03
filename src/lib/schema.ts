import { absoluteUrl } from './routes.mjs';
import { EDITORIAL_ENTITY } from '../data/editorial';
import { articleSchemaType } from './editorial-contracts.mjs';

export type BreadcrumbItem = { name: string; path: string };

const siteUrl = 'https://mariohealthbits.dev';
const publisher = {
	'@type': 'Organization',
	name: 'mariohealthbits.dev',
	url: absoluteUrl('/', siteUrl),
	logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` },
};

const breadcrumbSchema = (items: BreadcrumbItem[]) => ({
	'@type': 'BreadcrumbList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: absoluteUrl(item.path, siteUrl),
	})),
});

export function buildPersonSchema(lang: 'es' | 'en') {
	const url = absoluteUrl(EDITORIAL_ENTITY.url[lang], siteUrl);
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		'@id': `${url}#person`,
		name: EDITORIAL_ENTITY.name,
		jobTitle: EDITORIAL_ENTITY.role[lang],
		url,
		homeLocation: {
			'@type': 'Place',
			name: EDITORIAL_ENTITY.location,
			address: { '@type': 'PostalAddress', addressLocality: 'Puerto Natales', addressRegion: 'Patagonia', addressCountry: 'CL' },
		},
		sameAs: EDITORIAL_ENTITY.profiles.map((profile) => profile.url),
	};
}

function extractYouTubeId(input: string): string {
	const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
	return match ? match[1] : input.trim();
}

export function buildArticleSchema({ post, lang, path, breadcrumbs }: { post: any; lang: 'es' | 'en'; path: string; breadcrumbs: BreadcrumbItem[] }) {
	const modifiedDate = post.data.updatedDate ?? post.data.date;
	let videoSchema: Record<string, unknown> | undefined;

	if (post.data.youtubeId) {
		const videoId = extractYouTubeId(post.data.youtubeId);
		videoSchema = {
			'@context': 'https://schema.org',
			'@type': 'VideoObject',
			name: post.data.title,
			description: post.data.description,
			thumbnailUrl: [
				`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
				`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
				...(post.data.image ? [`${siteUrl}${post.data.image}`] : []),
			],
			uploadDate: post.data.date.toISOString(),
			embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
			contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
		};
	}

	const article: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': articleSchemaType(post.data.articleKind),
		headline: post.data.title,
		description: post.data.description,
		image: post.data.image ? `${siteUrl}${post.data.image}` : `${siteUrl}/img/marioHealthBits.png`,
		author: buildPersonSchema(lang),
		publisher,
		mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path, siteUrl) },
		datePublished: post.data.date.toISOString(),
		dateModified: modifiedDate.toISOString(),
		url: absoluteUrl(path, siteUrl),
		inLanguage: lang === 'es' ? 'es-CL' : 'en',
		keywords: post.data.tags,
		...(videoSchema ? { video: videoSchema } : {}),
	};

	const schemas = [article, breadcrumbSchema(breadcrumbs)];
	if (videoSchema) {
		schemas.push(videoSchema);
	}
	return schemas;
}

export function buildAuthorPageSchema({ name, description, lang, path, breadcrumbs }: { name: string; description: string; lang: 'es' | 'en'; path: string; breadcrumbs: BreadcrumbItem[] }) {
	const [page, breadcrumb] = buildCollectionPageSchema({ name, description, lang, path, breadcrumbs });
	const person = buildPersonSchema(lang);
	return [{ ...page, mainEntity: { '@id': person['@id'] } }, breadcrumb, person];
}

export function buildCollectionPageSchema({ name, description, lang, path, breadcrumbs, faqs = [] }: { name: string; description: string; lang: 'es' | 'en'; path: string; breadcrumbs: BreadcrumbItem[]; faqs?: { question: string; answer: string }[] }) {
	const schema: Record<string, unknown>[] = [{
		'@context': 'https://schema.org', '@type': 'CollectionPage', name, description,
		url: absoluteUrl(path, siteUrl), inLanguage: lang === 'es' ? 'es-CL' : 'en', publisher,
		mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path, siteUrl) },
	}, breadcrumbSchema(breadcrumbs)];
	if (faqs.length) schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) });
	return schema;
}
