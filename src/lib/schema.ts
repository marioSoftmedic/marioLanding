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

export function buildArticleSchema({ post, lang, path, breadcrumbs }: { post: any; lang: 'es' | 'en'; path: string; breadcrumbs: BreadcrumbItem[] }) {
	const modifiedDate = post.data.updatedDate ?? post.data.date;
	return [
		{
			'@context': 'https://schema.org',
			'@type': articleSchemaType(post.data.articleKind),
			headline: post.data.title,
			description: post.data.description,
			image: post.data.image ? `${siteUrl}${post.data.image}` : `${siteUrl}/img/marioHealthBits.png`,
			author: { '@type': 'Person', name: EDITORIAL_ENTITY.name, url: absoluteUrl(EDITORIAL_ENTITY.url[lang], siteUrl), jobTitle: EDITORIAL_ENTITY.role[lang], sameAs: EDITORIAL_ENTITY.profiles.map((profile) => profile.url) },
			publisher,
			mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path, siteUrl) },
			datePublished: post.data.date.toISOString(),
			dateModified: modifiedDate.toISOString(),
			url: absoluteUrl(path, siteUrl),
			inLanguage: lang === 'es' ? 'es-CL' : 'en',
			keywords: post.data.tags,
		},
		breadcrumbSchema(breadcrumbs),
	];
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
