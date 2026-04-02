export const defaultLang = 'es' as const;

export const ui = {
  es: {
    // Nav
    'nav.projects': 'Proyectos',
    'nav.stack': 'Stack',
    'nav.blog': 'Blog',
    'nav.news': 'Noticias',
    'nav.contact': 'Contacto',
    'nav.open-menu': 'Abrir menú',
    'nav.close-menu': 'Cerrar menú',
    'nav.lang-label': 'Cambiar idioma',
    // Skip
    'skip.content': 'Skip al contenido',
    // Footer
    'footer.made-with': 'Hecho con Astro',
    // Hero
    'hero.available': 'Disponible para proyectos',
    'hero.location': 'desde Puerto Natales, Patagonia',
    'hero.cta-projects': 'Ver proyectos',
    'hero.cta-contact': 'Contactar',
    'hero.blog-link': 'También escribo sobre IA y agentes',
    // About / Journey section
    'section.about.label': 'Trayectoria',
    'section.about.title': 'De la medicina a la IA',
    'section.about.subtitle': 'Tecnólogo Médico convertido en AI Builder desde Puerto Natales, Patagonia.',
    // Projects section
    'section.projects.label': 'Portafolio',
    'section.projects.title': 'Proyectos',
    'section.projects.subtitle': 'Agentes de IA, bots conversacionales y sistemas autónomos',
    'section.projects.specialties': 'Especialidades',
    // Specialties
    'spec.agents.label': 'AI Agents',
    'spec.agents.desc': 'Agentes autónomos con tool use',
    'spec.squads.label': 'Agent Squads',
    'spec.squads.desc': 'Orquestación multi-agente',
    'spec.bots.label': 'WhatsApp & Telegram Bots',
    'spec.bots.desc': 'Bots conversacionales con LLMs',
    'spec.memory.label': 'Memoria Semántica',
    'spec.memory.desc': 'pgvector + embeddings',
    'spec.mcp.label': 'MCP / Tool Use',
    'spec.mcp.desc': 'Integración de herramientas y APIs',
    'spec.automation.label': 'Automatización',
    'spec.automation.desc': 'Workflows y triggers autónomos',
    // Stack section
    'section.stack.label': 'Herramientas',
    'section.stack.title': 'Stack Técnico',
    'section.stack.subtitle': 'Fullstack · IA · Agentes autónomos',
    'stack.frontend': 'Frontend',
    'stack.backend': 'Backend & Datos',
    'stack.ai': 'IA & Agentes',
    // Blog section (homepage preview)
    'section.blog.label': 'Escritura',
    'section.blog.title': 'Últimas notas',
    'section.blog.subtitle': 'Lo que aprendo construyendo desde la Patagonia',
    'section.blog.cta': 'Ver blog',
    // Blog page
    'blog.page.meta.title': 'Blog — Mario Inostroza',
    'blog.page.meta.desc': 'Artículos sobre IA, agentes autónomos y desarrollo de software desde la Patagonia.',
    'blog.page.label': 'Escritura',
    'blog.page.heading': 'Blog',
    'blog.page.subtitle': 'IA, agentes y lo que aprendo construyendo desde la Patagonia.',
    'blog.page.empty': 'Próximamente — el primer post está en camino.',
    'blog.post.back': 'Blog',
    'blog.post.author': 'Mario Inostroza',
    // News section (homepage)
    'section.news.label': 'Feed',
    'section.news.title': 'Noticias de IA',
    'section.news.subtitle': 'Últimas novedades en inteligencia artificial',
    'section.news.cta': 'Ver todas',
    // News page
    'news.page.meta.title': 'Noticias de IA — Mario Inostroza',
    'news.page.meta.desc': 'Últimas noticias del mundo de la inteligencia artificial, agentes de IA y tecnología.',
    'news.page.back': 'Volver al inicio',
    'news.page.label': 'Feed',
    'news.page.heading': 'Noticias de IA',
    'news.page.subtitle': 'Últimas novedades del mundo de la inteligencia artificial, recopiladas automáticamente.',
    // Contact section
    'section.contact.label': 'Contacto',
    'section.contact.title': '¿Trabajamos juntos?',
    'section.contact.subtitle': 'Si tienes un proyecto en mente, charlemos.',
    // Projects detail
    'project.back': 'Volver a proyectos',
    'project.demo': 'Website',
    // Dates
    'date.locale': 'es-CL',
    // Meta defaults
    'meta.title': 'Mario Inostroza — Software Engineer & AI Builder',
    'meta.description': 'Desarrollador Fullstack · AI Builder · Puerto Natales, Patagonia',
  },
  en: {
    // Nav
    'nav.projects': 'Projects',
    'nav.stack': 'Stack',
    'nav.blog': 'Blog',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'nav.open-menu': 'Open menu',
    'nav.close-menu': 'Close menu',
    'nav.lang-label': 'Change language',
    // Skip
    'skip.content': 'Skip to content',
    // Footer
    'footer.made-with': 'Built with Astro',
    // Hero
    'hero.available': 'Available for projects',
    'hero.location': 'from Puerto Natales, Patagonia',
    'hero.cta-projects': 'View projects',
    'hero.cta-contact': 'Contact me',
    'hero.blog-link': 'I also write about AI and agents',
    // About / Journey section
    'section.about.label': 'Journey',
    'section.about.title': 'From Medicine to AI',
    'section.about.subtitle': 'Medical Technologist turned AI Builder from Puerto Natales, Patagonia.',
    // Projects section
    'section.projects.label': 'Portfolio',
    'section.projects.title': 'Projects',
    'section.projects.subtitle': 'AI agents, conversational bots and autonomous systems',
    'section.projects.specialties': 'Specialties',
    // Specialties
    'spec.agents.label': 'AI Agents',
    'spec.agents.desc': 'Autonomous agents with tool use',
    'spec.squads.label': 'Agent Squads',
    'spec.squads.desc': 'Multi-agent orchestration',
    'spec.bots.label': 'WhatsApp & Telegram Bots',
    'spec.bots.desc': 'Conversational bots with LLMs',
    'spec.memory.label': 'Semantic Memory',
    'spec.memory.desc': 'pgvector + embeddings',
    'spec.mcp.label': 'MCP / Tool Use',
    'spec.mcp.desc': 'Tool and API integration',
    'spec.automation.label': 'Automation',
    'spec.automation.desc': 'Autonomous workflows and triggers',
    // Stack section
    'section.stack.label': 'Tools',
    'section.stack.title': 'Tech Stack',
    'section.stack.subtitle': 'Fullstack · AI · Autonomous Agents',
    'stack.frontend': 'Frontend',
    'stack.backend': 'Backend & Data',
    'stack.ai': 'AI & Agents',
    // Blog section (homepage preview)
    'section.blog.label': 'Writing',
    'section.blog.title': 'Latest posts',
    'section.blog.subtitle': 'What I learn building from Patagonia',
    'section.blog.cta': 'View blog',
    // Blog page
    'blog.page.meta.title': 'Blog — Mario Inostroza',
    'blog.page.meta.desc': 'Articles about AI, autonomous agents and software development from Patagonia.',
    'blog.page.label': 'Writing',
    'blog.page.heading': 'Blog',
    'blog.page.subtitle': 'AI, agents and what I learn building from Patagonia.',
    'blog.page.empty': 'Coming soon — the first post is on its way.',
    'blog.post.back': 'Blog',
    'blog.post.author': 'Mario Inostroza',
    // News section (homepage)
    'section.news.label': 'Feed',
    'section.news.title': 'AI News',
    'section.news.subtitle': 'Latest developments in artificial intelligence',
    'section.news.cta': 'View all',
    // News page
    'news.page.meta.title': 'AI News — Mario Inostroza',
    'news.page.meta.desc': 'Latest news from the world of artificial intelligence, AI agents and technology.',
    'news.page.back': 'Back to home',
    'news.page.label': 'Feed',
    'news.page.heading': 'AI News',
    'news.page.subtitle': 'Latest developments in artificial intelligence, curated automatically.',
    // Contact section
    'section.contact.label': 'Contact',
    'section.contact.title': "Let's work together",
    'section.contact.subtitle': 'If you have a project in mind, let\'s chat.',
    // Projects detail
    'project.back': 'Back to projects',
    'project.demo': 'Website',
    // Dates
    'date.locale': 'en-US',
    // Meta defaults
    'meta.title': 'Mario Inostroza — Software Engineer & AI Builder',
    'meta.description': 'Fullstack Developer · AI Builder · Puerto Natales, Patagonia',
  },
} as const;

export type Lang = keyof typeof ui;
export type TranslationKey = keyof (typeof ui)['es'];
