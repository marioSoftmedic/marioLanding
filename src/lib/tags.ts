/**
 * Tag taxonomy + helpers for the blog.
 *
 * WHY this file exists:
 *   - Tags in Obsidian/MDX are strings written by humans (and Cotocha). Without
 *     a controlled vocabulary you end up with "IA" vs "AI" vs "ia",
 *     "Ley21668" vs "Ley 21.668", "Salud Digital" vs "SaludDigital", etc.
 *     Each variant becomes its own tag page with 1 post → useless navigation.
 *   - The site is bilingual (es/en), but the *concept* behind a tag is the
 *     same in both languages. We want /blog/tags/ai and /en/blog/tags/ai to
 *     both exist and reach the right posts in each language.
 *
 * MODEL:
 *   - Each tag has a stable canonical SLUG (lowercased, kebab-case, ASCII).
 *     The slug is the URL segment AND the join key across languages.
 *   - Each tag has a human display label per language ({ es, en }).
 *   - Each tag has a list of `aliases` — strings that authors might write in
 *     frontmatter that should normalize to this canonical slug.
 *
 * USAGE:
 *   - normalizeTag("IA")            → "ai"        (canonical slug)
 *   - tagDisplay("ai", "es")        → "IA"        (human label)
 *   - tagsForPost(post)             → string[]    (canonical slugs, deduped)
 *   - allCanonicalTags()            → TagDef[]
 *
 * GOTCHA: if a post has a tag that is NOT in the taxonomy, normalizeTag()
 * still returns a slugified version (so the site doesn't break) but
 * `validate-posts.mjs` will fail in CI and pre-commit. This is intentional:
 * unknown tags must either be added to the taxonomy or fixed in the post.
 */

export type Lang = 'es' | 'en';

export interface TagDef {
  /** Canonical URL-safe identifier. Lowercase, kebab-case, ASCII only. */
  slug: string;
  /** Human-readable label per language. */
  label: { es: string; en: string };
  /** Acceptable input variants (case-insensitive). Includes the slug itself. */
  aliases: string[];
  /** Optional short description, surfaced on the tag page header. */
  description?: { es: string; en: string };
}

/**
 * THE TAXONOMY.
 *
 * Adding a new tag? Add it here FIRST, then use it in posts.
 * The validator will reject any tag in a post that doesn't normalize to
 * one of these canonical slugs.
 *
 * Keep aliases in lowercase — the matcher lowercases inputs before comparing.
 */
export const TAG_TAXONOMY: TagDef[] = [
  // ── AI / Agents core ───────────────────────────────────────────────
  {
    slug: 'ai',
    label: { es: 'IA', en: 'AI' },
    aliases: ['ai', 'ia', 'inteligencia artificial', 'artificial intelligence'],
    description: {
      es: 'Inteligencia artificial aplicada: agentes, LLMs, evaluación, producción.',
      en: 'Applied artificial intelligence: agents, LLMs, evaluation, production.',
    },
  },
  {
    slug: 'agents',
    label: { es: 'Agentes', en: 'Agents' },
    aliases: ['agents', 'agentes', 'agente', 'agent'],
  },
  {
    slug: 'multi-agent',
    label: { es: 'Multi-Agente', en: 'Multi-Agent' },
    aliases: ['multi-agent', 'multi-agente', 'multiagente', 'multiagent', 'agent squads'],
  },
  {
    slug: 'mcp',
    label: { es: 'MCP', en: 'MCP' },
    aliases: ['mcp', 'model context protocol', 'tool use'],
  },
  {
    slug: 'llm',
    label: { es: 'LLM', en: 'LLM' },
    aliases: ['llm', 'llms'],
  },
  {
    slug: 'claude-api',
    label: { es: 'Claude API', en: 'Claude API' },
    aliases: ['claude api', 'claude-api', 'claude'],
  },
  {
    slug: 'opencode',
    label: { es: 'OpenCode', en: 'OpenCode' },
    aliases: ['opencode'],
  },

  // ── Projects ──────────────────────────────────────────────────────
  {
    slug: 'examya',
    label: { es: 'Examya', en: 'Examya' },
    aliases: ['examya', 'shuri'],
    description: {
      es: 'Agente médico de WhatsApp para órdenes de exámenes en Chile.',
      en: 'WhatsApp medical agent for exam orders in Chile.',
    },
  },
  {
    slug: 'cotocha',
    label: { es: 'Cotocha', en: 'Cotocha' },
    aliases: ['cotocha'],
    description: {
      es: 'Orquestador personal de agentes IA corriendo en VPS.',
      en: 'Personal AI agent orchestrator running on a VPS.',
    },
  },
  {
    slug: 'openclaw',
    label: { es: 'OpenClaw', en: 'OpenClaw' },
    aliases: ['openclaw'],
  },
  {
    slug: 'huillin',
    label: { es: 'Huillín', en: 'Huillín' },
    aliases: ['huillin', 'huillín', 'estepa patagonica', 'estepa patagónica'],
  },

  // ── Tech stack ────────────────────────────────────────────────────
  {
    slug: 'whatsapp',
    label: { es: 'WhatsApp', en: 'WhatsApp' },
    aliases: ['whatsapp'],
  },
  {
    slug: 'postgresql',
    label: { es: 'PostgreSQL', en: 'PostgreSQL' },
    aliases: ['postgresql', 'postgres'],
  },
  {
    slug: 'pgvector',
    label: { es: 'pgvector', en: 'pgvector' },
    aliases: ['pgvector'],
  },
  {
    slug: 'drizzle-orm',
    label: { es: 'Drizzle ORM', en: 'Drizzle ORM' },
    aliases: ['drizzle orm', 'drizzle-orm', 'drizzle'],
  },
  {
    slug: 'prisma',
    label: { es: 'Prisma', en: 'Prisma' },
    aliases: ['prisma'],
  },
  {
    slug: 'nestjs',
    label: { es: 'NestJS', en: 'NestJS' },
    aliases: ['nestjs', 'nest'],
  },
  {
    slug: 'typescript',
    label: { es: 'TypeScript', en: 'TypeScript' },
    aliases: ['typescript', 'ts'],
  },
  {
    slug: 'backend',
    label: { es: 'Backend', en: 'Backend' },
    aliases: ['backend', 'backend & datos', 'backend & data'],
  },
  {
    slug: 'vps',
    label: { es: 'VPS', en: 'VPS' },
    aliases: ['vps'],
  },
  {
    slug: 'infrastructure',
    label: { es: 'Infraestructura', en: 'Infrastructure' },
    aliases: ['infrastructure', 'infraestructura'],
  },

  // ── Engineering practices ─────────────────────────────────────────
  {
    slug: 'architecture',
    label: { es: 'Arquitectura', en: 'Architecture' },
    aliases: ['architecture', 'arquitectura'],
  },
  {
    slug: 'integration',
    label: { es: 'Integración', en: 'Integration' },
    aliases: ['integration', 'integración', 'integracion'],
  },
  {
    slug: 'automation',
    label: { es: 'Automatización', en: 'Automation' },
    aliases: ['automation', 'automatización', 'automatizacion'],
  },
  {
    slug: 'testing',
    label: { es: 'Testing', en: 'Testing' },
    aliases: ['testing', 'tests', 'pruebas'],
  },
  {
    slug: 'evaluation',
    label: { es: 'Evaluación', en: 'Evaluation' },
    aliases: ['evaluation', 'evaluación', 'evaluacion'],
  },
  {
    slug: 'deepeval',
    label: { es: 'DeepEval', en: 'DeepEval' },
    aliases: ['deepeval'],
  },
  {
    slug: 'production',
    label: { es: 'Producción', en: 'Production' },
    aliases: ['production', 'producción', 'produccion'],
  },
  {
    slug: 'pipeline',
    label: { es: 'Pipeline', en: 'Pipeline' },
    aliases: ['pipeline'],
  },
  {
    slug: 'sync',
    label: { es: 'Sincronización', en: 'Synchronization' },
    aliases: ['sync', 'synchronization', 'sincronización', 'sincronizacion'],
  },
  {
    slug: 'memory',
    label: { es: 'Memoria', en: 'Memory' },
    aliases: ['memory', 'memoria'],
  },
  {
    slug: 'pkm',
    label: { es: 'PKM', en: 'PKM' },
    aliases: ['pkm', 'personal knowledge management'],
  },
  {
    slug: 'obsidian',
    label: { es: 'Obsidian', en: 'Obsidian' },
    aliases: ['obsidian'],
  },
  {
    slug: 'engram',
    label: { es: 'Engram', en: 'Engram' },
    aliases: ['engram'],
  },
  {
    slug: 'karpathy',
    label: { es: 'Karpathy', en: 'Karpathy' },
    aliases: ['karpathy'],
  },
  {
    slug: 'development',
    label: { es: 'Desarrollo', en: 'Development' },
    aliases: ['development', 'desarrollo'],
  },

  // ── Vision / OCR ──────────────────────────────────────────────────
  {
    slug: 'ocr',
    label: { es: 'OCR', en: 'OCR' },
    aliases: ['ocr'],
  },
  {
    slug: 'vision',
    label: { es: 'Visión', en: 'Vision' },
    aliases: ['vision', 'visión'],
  },

  // ── Health / Interoperability ─────────────────────────────────────
  {
    slug: 'digital-health',
    label: { es: 'Salud Digital', en: 'Digital Health' },
    aliases: ['digital health', 'salud digital', 'saluddigital', 'digitalhealth', 'healthtech', 'salud'],
  },
  {
    slug: 'interoperability',
    label: { es: 'Interoperabilidad', en: 'Interoperability' },
    aliases: ['interoperability', 'interoperabilidad'],
  },
  {
    slug: 'fhir',
    label: { es: 'FHIR', en: 'FHIR' },
    aliases: ['fhir'],
  },
  {
    slug: 'hl7',
    label: { es: 'HL7', en: 'HL7' },
    aliases: ['hl7'],
  },
  {
    slug: 'snomed',
    label: { es: 'SNOMED', en: 'SNOMED' },
    aliases: ['snomed'],
  },
  {
    slug: 'ley-21668',
    label: { es: 'Ley 21.668', en: 'Law 21.668' },
    aliases: ['ley 21.668', 'ley21668', 'ley-21-668', 'ley 21668', 'law 21.668', 'law21668', 'law 21668'],
    description: {
      es: 'Ley chilena que obliga la interoperabilidad de fichas clínicas.',
      en: 'Chilean law mandating clinical record interoperability.',
    },
  },
  {
    slug: 'fonasa',
    label: { es: 'FONASA', en: 'FONASA' },
    aliases: ['fonasa'],
  },
  {
    slug: 'clinical-labs',
    label: { es: 'Laboratorios Clínicos', en: 'Clinical Labs' },
    aliases: ['clinical labs', 'laboratorios clinicos', 'laboratorios clínicos'],
  },
  {
    slug: 'medical',
    label: { es: 'Médico', en: 'Medical' },
    aliases: ['medical', 'medico', 'médico'],
  },
  {
    slug: 'healthcare',
    label: { es: 'Salud', en: 'Healthcare' },
    aliases: ['healthcare'],
  },
  {
    slug: 'crowdsourcing',
    label: { es: 'Crowdsourcing', en: 'Crowdsourcing' },
    aliases: ['crowdsourcing'],
  },
  {
    slug: 'pricing',
    label: { es: 'Precios', en: 'Pricing' },
    aliases: ['pricing', 'precios'],
  },

  // ── Payments ──────────────────────────────────────────────────────
  {
    slug: 'payments',
    label: { es: 'Pagos', en: 'Payments' },
    aliases: ['payments', 'pagos'],
  },
  {
    slug: 'mercado-pago',
    label: { es: 'Mercado Pago', en: 'Mercado Pago' },
    aliases: ['mercado pago', 'mercadopago'],
  },
  {
    slug: 'stripe',
    label: { es: 'Stripe', en: 'Stripe' },
    aliases: ['stripe'],
  },

  // ── Story / Personal ──────────────────────────────────────────────
  {
    slug: 'story',
    label: { es: 'Historia', en: 'Story' },
    aliases: ['story', 'historia'],
  },
  {
    slug: 'patagonia',
    label: { es: 'Patagonia', en: 'Patagonia' },
    aliases: ['patagonia'],
  },
  {
    slug: 'chile',
    label: { es: 'Chile', en: 'Chile' },
    aliases: ['chile'],
  },
  {
    slug: 'biohealth',
    label: { es: 'Biohealth', en: 'Biohealth' },
    aliases: ['biohealth'],
  },
  {
    slug: 'entrepreneurship',
    label: { es: 'Emprendimiento', en: 'Entrepreneurship' },
    aliases: ['entrepreneurship', 'emprendimiento'],
  },
];

// ── Lookups built once at module load ────────────────────────────────
const ALIAS_TO_SLUG: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const def of TAG_TAXONOMY) {
    m.set(def.slug.toLowerCase(), def.slug);
    for (const alias of def.aliases) {
      m.set(alias.toLowerCase().trim(), def.slug);
    }
  }
  return m;
})();

const SLUG_TO_DEF: Map<string, TagDef> = new Map(TAG_TAXONOMY.map((d) => [d.slug, d]));

// ── Public API ───────────────────────────────────────────────────────

/**
 * URL-safe slugify for ANY string. Strips diacritics, lowercases, replaces
 * non-alphanumerics with hyphens. Used as the fallback when a tag is not in
 * the taxonomy (so the site doesn't crash) and as the implementation of
 * canonical slugs themselves.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining marks (é → e)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Map any tag string written by an author to its canonical slug.
 * If the tag is not in the taxonomy, returns a best-effort slugified version
 * (validate-posts.mjs will catch this in CI).
 */
export function normalizeTag(raw: string): string {
  const key = raw.toLowerCase().trim();
  const canonical = ALIAS_TO_SLUG.get(key);
  if (canonical) return canonical;
  // Fallback: don't break the site on unknown tags. Validator will reject.
  return slugify(raw);
}

/**
 * Returns true if the raw tag is recognized by the taxonomy.
 * Used by validate-posts.mjs.
 */
export function isKnownTag(raw: string): boolean {
  return ALIAS_TO_SLUG.has(raw.toLowerCase().trim());
}

/**
 * Human display label for a canonical slug, in the requested language.
 * Falls back to a title-cased version of the slug if it's not in the taxonomy.
 */
export function tagDisplay(slug: string, lang: Lang): string {
  const def = SLUG_TO_DEF.get(slug);
  if (def) return def.label[lang];
  // Fallback: turn "salud-digital" → "Salud Digital"
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Get the description for a tag (if any).
 */
export function tagDescription(slug: string, lang: Lang): string | undefined {
  return SLUG_TO_DEF.get(slug)?.description?.[lang];
}

/**
 * Normalize and dedupe the tag list of a post.
 * Used by every page that reads `post.data.tags`.
 */
export function tagsForPost(rawTags: readonly string[] | undefined | null): string[] {
  if (!rawTags || rawTags.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of rawTags) {
    const slug = normalizeTag(raw);
    if (!seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

/**
 * Full taxonomy as a stable list, sorted by canonical slug.
 * Useful for building the /blog/tags index page.
 */
export function allCanonicalTags(): TagDef[] {
  return [...TAG_TAXONOMY].sort((a, b) => a.slug.localeCompare(b.slug));
}
