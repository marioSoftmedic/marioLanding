export const EDITORIAL_ENTITY = {
	name: 'Mario Inostroza',
	role: {
		es: 'Tecnólogo Médico y builder de sistemas de salud e inteligencia artificial',
		en: 'Medical Technologist and builder of health and artificial intelligence systems',
	},
	url: { es: '/autor/', en: '/en/author/' },
	profiles: [
		{ label: 'X', url: 'https://x.com/marioHealthBits' },
	],
	policy: {
		reviewCadence: 'quarterly',
		disclaimer: 'educational and technical content; not medical, legal, or regulatory advice',
	},
} as const;
