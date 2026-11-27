// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'opencode-agent-radar',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/JSisques/agent-radar' }],
			sidebar: [
				{ label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
				{ label: 'Specs', items: [{ autogenerate: { directory: 'specs' } }] },
				{ label: 'Architecture', items: [{ autogenerate: { directory: 'architecture' } }] },
				{ label: 'Decisions (ADR)', items: [{ autogenerate: { directory: 'adr' } }] },
			],
		}),
	],
});
