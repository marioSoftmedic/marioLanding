import portrait from '../assets/images/marioHealthBits4.png';

export type EditorialLocale = 'es' | 'en';

export const EDITORIAL_ENTITY = {
	name: 'Mario Inostroza',
	role: {
		es: 'Tecnólogo Médico y builder de sistemas de salud e inteligencia artificial',
		en: 'Medical Technologist and builder of health and artificial-intelligence systems',
	},
	location: 'Puerto Natales, Patagonia, Chile',
	url: { es: '/autor/', en: '/en/author/' },
	image: portrait,
	profiles: [
		{ id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mario-inostroza-softmedic/' },
		{ id: 'x', label: 'X / Twitter', url: 'https://x.com/marioHealthBits' },
		{ id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/mariohealthbits/' },
		{ id: 'github', label: 'GitHub', url: 'https://github.com/marioSoftmedic' },
	],
	positioning: {
		es: 'Escribo desde la intersección entre la operación de laboratorio clínico y la construcción de software y agentes de IA para flujos de salud en producción.',
		en: 'I write at the intersection of clinical laboratory operations and the construction of software and AI agents for production health workflows.',
	},
	experience: [
		{
			year: '2021',
			title: { es: 'Operaciones de laboratorio en Biohealth', en: 'Laboratory operations at Biohealth' },
			description: {
				es: 'El trabajo con planillas y reportes manuales mostró la necesidad de flujos más trazables y luego informó la idea de Examya.',
				en: 'Working with manual spreadsheets and reporting exposed the need for more traceable workflows and later informed the idea for Examya.',
			},
			link: { es: '/laboratorio-clinico-api/', en: '/en/clinical-lab-api/' },
			linkLabel: { es: 'Explorar Laboratorio clínico como API', en: 'Explore Clinical Lab as API' },
		},
		{
			year: 'Ahora',
			title: { es: 'Examya', en: 'Examya' },
			description: {
				es: 'Experiencia construyendo automatización para sistemas de salud y flujos clínicos, con límites explícitos y revisión humana.',
				en: 'Experience building automation for health systems and clinical workflows, with explicit boundaries and human review.',
			},
			link: { es: '/examya/', en: '/en/examya/' },
			linkLabel: { es: 'Conocer Examya', en: 'Explore Examya' },
		},
		{
			year: 'Ahora',
			title: { es: 'Cotocha', en: 'Cotocha' },
			description: {
				es: 'Experiencia orquestando agentes en producción y aplicando validaciones deterministas antes de efectos externos.',
				en: 'Experience orchestrating production agents and applying deterministic validation before external effects.',
			},
			link: { es: '/projects/openclaw/', en: '/en/projects/openclaw/' },
			linkLabel: { es: 'Conocer Cotocha', en: 'Explore Cotocha' },
		},
	],
	policy: {
		principles: {
			es: [
				{ title: 'Fuentes', description: 'Priorizo fuentes primarias para afirmaciones legales, regulatorias y de sistemas públicos.' },
				{ title: 'Revisión', description: 'Reviso el contenido trimestralmente y cuando cambia una fuente relevante.' },
				{ title: 'Correcciones', description: 'Las correcciones materiales se anotan con fecha junto a la actualización del artículo.' },
				{ title: 'Límites', description: 'El contenido es educativo y técnico; no constituye consejo médico, legal ni regulatorio.' },
			],
			en: [
				{ title: 'Sources', description: 'I prioritize primary sources for legal, regulatory, and public-system claims.' },
				{ title: 'Review', description: 'I review content quarterly and when a relevant source changes.' },
				{ title: 'Corrections', description: 'Material corrections are dated alongside the article update.' },
				{ title: 'Boundaries', description: 'Content is educational and technical; it is not medical, legal, or regulatory advice.' },
			],
		},
	},
	actions: {
		contact: { es: '/#contacto', en: '/en/#contacto' },
		correction: 'mailto:mario.inostroza.m@gmail.com?subject=Correction%20for%20mariohealthbits.dev',
	},
	reading: [
		{ title: { es: 'Laboratorio clínico como API', en: 'Clinical Lab as API' }, description: { es: 'Flujos clínicos, trazabilidad e interoperabilidad.', en: 'Clinical workflows, traceability, and interoperability.' }, link: { es: '/laboratorio-clinico-api/', en: '/en/clinical-lab-api/' } },
		{ title: { es: 'Agentes de IA en producción', en: 'AI Agents in Production' }, description: { es: 'Límites, observabilidad y validación determinista.', en: 'Boundaries, observability, and deterministic validation.' }, link: { es: '/agentes-ia-produccion/', en: '/en/ai-agents-production/' } },
	],
} as const;
