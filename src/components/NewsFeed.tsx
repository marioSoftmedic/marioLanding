import { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  points: number;
  time: string;
  category: 'trending' | 'agents' | 'research';
}

type Category = 'all' | 'trending' | 'agents' | 'research';

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todas', emoji: '📰' },
  { key: 'trending', label: 'Tendencias', emoji: '🔥' },
  { key: 'agents', label: 'Agentes de IA', emoji: '🤖' },
  { key: 'research', label: 'Investigación', emoji: '🔍' },
];

const KEYWORDS: Record<Exclude<Category, 'all'>, string[]> = {
  trending: ['ai', 'gpt', 'llm', 'openai', 'anthropic', 'gemini', 'claude', 'chatgpt', 'ai agent'],
  agents: ['agent', 'agentic', 'autonomous', 'tool use', 'mcp', 'function calling', 'workflow'],
  research: ['paper', 'research', 'model', 'training', 'benchmark', 'arxiv', 'study', 'fine-tuning'],
};

// ─── Fetchers ────────────────────────────────────────────────────────
async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids: number[] = await res.json();

    const items = await Promise.all(
      ids.slice(0, 30).map(async (id) => {
        try {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return r.json();
        } catch {
          return null;
        }
      })
    );

    return items
      .filter((item): item is NonNullable<typeof item> => item !== null && item.title)
      .filter((item) => {
        const t = item.title.toLowerCase();
        return KEYWORDS.trending.some((k) => t.includes(k));
      })
      .slice(0, 10)
      .map((item) => ({
        id: `hn-${item.id}`,
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        source: 'Hacker News',
        points: item.score || 0,
        time: new Date(item.time * 1000).toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'short',
        }),
        category: categorize(item.title) as NewsItem['category'],
      }));
  } catch (err) {
    console.error('Failed to fetch HackerNews:', err);
    return [];
  }
}

async function fetchReddit(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://www.reddit.com/r/artificial.json');
    const data = await res.json();

    return data.data.children
      .slice(0, 15)
      .map((post: any) => ({
        id: `reddit-${post.data.id}`,
        title: post.data.title,
        url: post.data.url_overridden_by_dest || `https://reddit.com${post.data.permalink}`,
        source: 'Reddit r/artificial',
        points: post.data.score || 0,
        time: new Date(post.data.created_utc * 1000).toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'short',
        }),
        category: categorize(post.data.title) as NewsItem['category'],
      }));
  } catch (err) {
    console.error('Failed to fetch Reddit:', err);
    return [];
  }
}

function categorize(title: string): NewsItem['category'] {
  const t = title.toLowerCase();
  if (KEYWORDS.agents.some((k) => t.includes(k))) return 'agents';
  if (KEYWORDS.research.some((k) => t.includes(k))) return 'research';
  return 'trending';
}

// ─── Component ───────────────────────────────────────────────────────
export default function NewsFeed({ limit }: { limit?: number }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [hnItems, redditItems] = await Promise.all([
          fetchHackerNews(),
          fetchReddit(),
        ]);

        const all = [...hnItems, ...redditItems]
          .sort((a, b) => b.points - a.points);

        setNews(all);
      } catch (err) {
        setError('No se pudieron cargar las noticias. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    activeCategory === 'all'
      ? news
      : news.filter((n) => n.category === activeCategory);

  const displayed = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              activeCategory === cat.key
                ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-zinc-900 rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 text-center text-sm text-zinc-500 border border-zinc-800 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {displayed.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">
              No hay noticias en esta categoría ahora.
            </p>
          )}
          {displayed.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900/50 transition-all"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-zinc-500">{item.source}</span>
                  <span className="text-xs text-zinc-600">&middot;</span>
                  <span className="text-xs text-zinc-500">{item.time}</span>
                  <span className="text-xs text-zinc-600">&middot;</span>
                  <span className="text-xs text-orange-500/70">▲ {item.points}</span>
                </div>
              </div>
              <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-lg">↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
