import { getCollection, type CollectionEntry } from "astro:content";
import { HUBS, hubPath } from "./hubs";
import { tagsForPost, type Lang } from "./tags";
import { canonicalPath, languageFromPath } from "./routes.mjs";

type Pair = Partial<Record<Lang, string>>;

let cache: Map<string, string> | null = null;

function sourceStem(entry: { id: string; filePath?: string }): string {
	const name = entry.filePath?.split("/").pop() ?? entry.id;
	return name.replace(/\.en\.(md|mdx)$/, "").replace(/\.(md|mdx)$/, "").replace(/\.en$/, "");
}

function postSlug(post: CollectionEntry<"blog">): string {
	return post.data.canonicalSlug ?? post.id.replace(/\.en\.(md|mdx)$/, "").replace(/\.en$/, "");
}

function addPair(index: Map<string, string>, pair: Pair) {
	if (!pair.es || !pair.en) return;
	index.set(canonicalPath(pair.es), canonicalPath(pair.en));
	index.set(canonicalPath(pair.en), canonicalPath(pair.es));
}

async function buildIndex(): Promise<Map<string, string>> {
	if (cache) return cache;

	const index = new Map<string, string>();
	addPair(index, { es: "/", en: "/en/" });
	addPair(index, { es: "/blog/", en: "/en/blog/" });
	addPair(index, { es: "/blog/tags/", en: "/en/blog/tags/" });
	for (const hub of HUBS) addPair(index, { es: hubPath(hub, "es"), en: hubPath(hub, "en") });

	const blogPairs = new Map<string, Pair>();
	const tagLanguages = new Map<string, Set<Lang>>();
	for (const post of await getCollection("blog")) {
		if (post.data.draft) continue;
		const pair = blogPairs.get(sourceStem(post)) ?? {};
		pair[post.data.lang] = `/${post.data.lang === "en" ? "en/" : ""}blog/${postSlug(post)}/`;
		blogPairs.set(sourceStem(post), pair);
		for (const tag of tagsForPost(post.data.tags)) {
			const languages = tagLanguages.get(tag) ?? new Set<Lang>();
			languages.add(post.data.lang);
			tagLanguages.set(tag, languages);
		}
	}
	for (const pair of blogPairs.values()) addPair(index, pair);
	for (const [tag, languages] of tagLanguages) {
		if (languages.size === 2) addPair(index, { es: `/blog/tags/${tag}/`, en: `/en/blog/tags/${tag}/` });
	}

	const projectPairs = new Map<string, Pair>();
	for (const project of await getCollection("projects")) {
		const stem = sourceStem(project);
		const pair = projectPairs.get(stem) ?? {};
		pair[project.data.lang] = `/${project.data.lang === "en" ? "en/" : ""}projects/${stem}/`;
		projectPairs.set(stem, pair);
	}
	for (const pair of projectPairs.values()) addPair(index, pair);

	cache = index;
	return index;
}

export async function resolveAlternatePath(pathname: string, currentLang: Lang): Promise<string | null> {
	const canonical = canonicalPath(pathname);
	if (languageFromPath(canonical) !== currentLang) return null;
	return (await buildIndex()).get(canonical) ?? null;
}
