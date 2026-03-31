import React, { useState, useEffect } from 'react';

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

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'trending', label: 'Tendencias' },
  { key: 'agents', label: 'Agentes de IA' },
  { key: 'research', label: 'Investigación' },
];

const KEYWORDS: Record<Exclude<Category, 'all'>, string[]> = {
  trending: ['ai', 'gpt', 'llm', 'openai', 'anthropic', 'gemini', 'claude', 'chatgpt', 'ai agent'],
  agents: ['agent', 'agentic', 'autonomous', 'tool use', 'mcp', 'function calling', 'workflow'],
  research: ['paper', 'research', 'model', 'training', 'benchmark', 'arxiv', 'study', 'fine-tuning'],
};

async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=15');
    const data = await res.json();
    return data.hits.map((hit: any) => ({
      id: `hn-${hit.objectID}`,
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: 'Hacker News',
      points: hit.points || 0,
      time: new Date(hit.created_at_i * 1000).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
      category: categorize(hit.title),
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
    return data.data.children.slice(0, 15).map((post: any) => ({
      id: `reddit-${post.data.id}`,
      title: post.data.title,
      url: post.data.url_overridden_by_dest || `https://reddit.com${post.data.permalink}`,
      source: 'Reddit r/artificial',
      points: post.data.score || 0,
      time: new Date(post.data.created_utc * 1000).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
      category: categorize(post.data.title),
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

export default function NewsFeed({ limit }: { limit?: number }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [hnItems, redditItems] = await Promise.all([fetchHackerNews(), fetchReddit()]);
        const all = [...hnItems, ...redditItems].sort((a, b) => b.points - a.points);
        setNews(all);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar las noticias. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [retryCount]);

  const filtered =
    activeCategory === 'all' ? news : news.filter((n) => n.category === activeCategory);
  const displayed = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            aria-label={cat.label}
            className="px-4 py-2 text-sm rounded-lg min-h-[44px] cursor-pointer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: activeCategory === cat.key ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
              background: activeCategory === cat.key ? 'var(--accent-orange-glow)' : 'var(--bg-elevated)',
              color: activeCategory === cat.key ? 'var(--accent-orange)' : 'var(--text-muted)',
              transition: 'border-color 200ms ease, background-color 200ms ease, color 200ms ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 64, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--bg-elevated)' }}>
          <p>{error}</p>
          <button
            onClick={() => { setRetryCount((c) => c + 1); setLoading(true); }}
            style={{ marginTop: 12, padding: '8px 16px', fontSize: 14, borderRadius: 8, cursor: 'pointer', color: 'var(--accent-orange)', border: '1px solid var(--accent-orange-glow)', background: 'var(--accent-orange-glow)' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {displayed.length === 0 && (
            <p style={{ fontSize: 14, textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No hay noticias en esta categoría.
            </p>
          )}
          {displayed.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.title} (se abre en nueva pestaña)`}
              className="news-item group"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                transition: 'border-color 200ms ease, background-color 200ms ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--text-primary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, lineClamp: 2, overflow: 'hidden' }}>
                  {item.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.source}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>&middot;</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.time}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>&middot;</span>
                  <span style={{ fontSize: 12, color: 'var(--accent-orange)', fontWeight: 600 }}>&#965; {item.points}</span>
                </div>
              </div>
              <svg style={{ display: 'inline-block', color: 'var(--text-faint)', flexShrink: 0, marginTop: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
