import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

interface CoverConfig {
	readonly id: string;
	readonly title: string;
	readonly subtitle: string;
	readonly palette: readonly [string, string, string, string];
	readonly motif: 'pond' | 'garden' | 'storybook' | 'rabbit' | 'rhymes' | 'seuss' | 'eggs' | 'moon';
}

const covers: readonly CoverConfig[] = [
	{
		id: 'frog-and-toad',
		title: 'Frog and Toad',
		subtitle: 'Audiobook Playlist',
		palette: ['#284b3f', '#7fb069', '#d7c77b', '#f4e9c5'],
		motif: 'pond',
	},
	{
		id: 'beatrix-potter',
		title: 'Beatrix Potter',
		subtitle: 'Story Treasury',
		palette: ['#3f5e3a', '#8bb174', '#e4c988', '#fff0cf'],
		motif: 'garden',
	},
	{
		id: 'little-red-riding-hood',
		title: 'Little Red Riding Hood',
		subtitle: 'Favorite Stories',
		palette: ['#3d2634', '#b83b4b', '#f0b35a', '#fff1d0'],
		motif: 'storybook',
	},
	{
		id: 'uncle-wiggily-story-book',
		title: "Uncle Wiggily's Story Book",
		subtitle: 'Howard R. Garis',
		palette: ['#32423d', '#9f7353', '#d8b46a', '#f6ecd6'],
		motif: 'rabbit',
	},
	{
		id: 'roald-dahl-revolting-rhymes',
		title: "Roald Dahl's Revolting Rhymes",
		subtitle: 'Story Playlist',
		palette: ['#33283f', '#df5b3f', '#f6c75f', '#fbf1ce'],
		motif: 'rhymes',
	},
	{
		id: 'dr-seuss-rik-mayall',
		title: 'Dr. Seuss Collection',
		subtitle: 'Read by Rik Mayall',
		palette: ['#243a5e', '#e84f68', '#58b6c0', '#fff3c7'],
		motif: 'seuss',
	},
	{
		id: 'dr-seuss-cat-in-the-hat',
		title: 'Cat in the Hat and Other Stories',
		subtitle: 'Dr. Seuss',
		palette: ['#25364f', '#e24444', '#f3f4ef', '#70b7c7'],
		motif: 'seuss',
	},
	{
		id: 'dr-seuss-scrambled-eggs-super',
		title: 'Scrambled Eggs Super',
		subtitle: 'And Other Stories',
		palette: ['#30424a', '#f2ca52', '#e8744f', '#fff7ce'],
		motif: 'eggs',
	},
	{
		id: 'when-you-grow-up',
		title: 'When You Grow Up',
		subtitle: 'Audiobook Playlist',
		palette: ['#284156', '#58a6a6', '#f4c95d', '#f8efd4'],
		motif: 'storybook',
	},
	{
		id: 'roald-dahl-bfg',
		title: 'Roald Dahl - The BFG',
		subtitle: 'Audiobook Playlist',
		palette: ['#1e2c46', '#6c6fa9', '#ffd36e', '#f2ecd8'],
		motif: 'moon',
	},
];

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function wrapTitle(title: string): readonly string[] {
	const words = title.split(/\s+/);
	const lines: string[] = [];
	let current = '';

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length > 18 && current) {
			lines.push(current);
			current = word;
		} else {
			current = candidate;
		}
	}

	if (current) {
		lines.push(current);
	}

	return lines.slice(0, 4);
}

function renderMotif(config: CoverConfig): string {
	const [bg, accent, warm, paper] = config.palette;

	switch (config.motif) {
		case 'pond':
			return `
				<ellipse cx="700" cy="1030" rx="520" ry="150" fill="${accent}" opacity="0.28" />
				<circle cx="510" cy="680" r="96" fill="${accent}" />
				<circle cx="473" cy="642" r="22" fill="${paper}" /><circle cx="547" cy="642" r="22" fill="${paper}" />
				<circle cx="477" cy="646" r="9" fill="${bg}" /><circle cx="543" cy="646" r="9" fill="${bg}" />
				<path d="M454 704 Q510 746 566 704" fill="none" stroke="${bg}" stroke-width="14" stroke-linecap="round" />
				<circle cx="865" cy="700" r="88" fill="${warm}" />
				<circle cx="828" cy="665" r="20" fill="${paper}" /><circle cx="898" cy="665" r="20" fill="${paper}" />
				<circle cx="833" cy="669" r="8" fill="${bg}" /><circle cx="893" cy="669" r="8" fill="${bg}" />`;
		case 'garden':
			return `
				<path d="M330 930 C480 820 650 820 795 930 C650 1040 480 1040 330 930Z" fill="${accent}" opacity="0.5" />
				<path d="M690 865 C820 760 980 790 1075 930 C930 1010 795 1000 690 865Z" fill="${warm}" opacity="0.55" />
				<circle cx="570" cy="710" r="72" fill="${paper}" />
				<path d="M528 656 C500 550 542 500 590 640" fill="${paper}" />
				<path d="M611 660 C660 552 715 545 655 690" fill="${paper}" />
				<circle cx="548" cy="704" r="8" fill="${bg}" /><circle cx="594" cy="704" r="8" fill="${bg}" />`;
		case 'rabbit':
			return `
				<circle cx="700" cy="720" r="118" fill="${paper}" />
				<path d="M635 625 C600 470 670 450 692 620" fill="${paper}" />
				<path d="M754 625 C792 475 860 470 807 642" fill="${paper}" />
				<circle cx="660" cy="716" r="10" fill="${bg}" /><circle cx="740" cy="716" r="10" fill="${bg}" />
				<path d="M700 746 L678 775 M700 746 L724 775" stroke="${bg}" stroke-width="9" stroke-linecap="round" />
				<path d="M790 830 C885 920 840 1010 740 980" fill="none" stroke="${warm}" stroke-width="26" stroke-linecap="round" />`;
		case 'rhymes':
			return `
				<path d="M360 615 L595 545 L580 905 L345 980Z" fill="${paper}" opacity="0.92" />
				<path d="M595 545 L850 630 L855 980 L580 905Z" fill="${warm}" opacity="0.88" />
				<path d="M725 470 L680 650 L820 650 L650 935 L705 720 L570 720Z" fill="${accent}" />
				<circle cx="1000" cy="850" r="92" fill="${paper}" opacity="0.24" />`;
		case 'seuss':
			return `
				<path d="M270 780 C395 650 535 925 665 760 C785 605 940 690 1050 565" fill="none" stroke="${warm}" stroke-width="46" stroke-linecap="round" />
				<path d="M320 970 C455 820 615 1100 775 925 C900 790 1020 900 1120 780" fill="none" stroke="${accent}" stroke-width="46" stroke-linecap="round" />
				<circle cx="456" cy="622" r="58" fill="${paper}" />
				<circle cx="930" cy="705" r="48" fill="${paper}" opacity="0.9" />
				<rect x="608" y="550" width="190" height="70" rx="35" fill="${paper}" transform="rotate(-9 703 585)" />`;
		case 'eggs':
			return `
				<ellipse cx="505" cy="760" rx="120" ry="156" fill="${paper}" transform="rotate(-18 505 760)" />
				<ellipse cx="780" cy="725" rx="126" ry="165" fill="${paper}" transform="rotate(16 780 725)" />
				<circle cx="506" cy="780" r="48" fill="${warm}" />
				<circle cx="780" cy="746" r="52" fill="${accent}" />
				<path d="M320 995 C520 890 800 1110 1075 948" fill="none" stroke="${warm}" stroke-width="36" stroke-linecap="round" />`;
		case 'moon':
			return `
				<circle cx="930" cy="410" r="112" fill="${warm}" />
				<circle cx="985" cy="375" r="102" fill="${bg}" opacity="0.5" />
				<path d="M465 1025 C585 850 735 850 875 1025" fill="none" stroke="${accent}" stroke-width="44" stroke-linecap="round" />
				<ellipse cx="585" cy="825" rx="70" ry="108" fill="${paper}" opacity="0.82" />
				<ellipse cx="760" cy="820" rx="76" ry="118" fill="${paper}" opacity="0.82" />`;
		case 'storybook':
			return `
				<path d="M360 650 L680 575 L680 990 L360 1065Z" fill="${paper}" opacity="0.94" />
				<path d="M680 575 L1020 655 L1020 1065 L680 990Z" fill="${warm}" opacity="0.82" />
				<path d="M474 720 H610 M460 790 H610 M452 860 H600" stroke="${bg}" stroke-width="16" stroke-linecap="round" opacity="0.55" />
				<path d="M786 745 H930 M785 820 H944 M785 895 H915" stroke="${bg}" stroke-width="16" stroke-linecap="round" opacity="0.45" />`;
	}
}

function renderCover(config: CoverConfig): string {
	const [bg, accent, warm, paper] = config.palette;
	const titleLines = wrapTitle(config.title);
	const titleStart = titleLines.length > 2 ? 176 : 218;
	const titleSvg = titleLines
		.map((line, index) => {
			const size = line.length > 17 ? 82 : 92;
			return `<text x="700" y="${titleStart + index * 94}" text-anchor="middle" font-size="${size}" font-weight="800">${escapeHtml(line)}</text>`;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="0 0 1400 1400">
		<defs>
			<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="${bg}" />
				<stop offset="1" stop-color="#111827" />
			</linearGradient>
			<radialGradient id="glow" cx="50%" cy="32%" r="66%">
				<stop offset="0" stop-color="${accent}" stop-opacity="0.5" />
				<stop offset="1" stop-color="${bg}" stop-opacity="0" />
			</radialGradient>
		</defs>
		<rect width="1400" height="1400" fill="url(#bg)" />
		<rect width="1400" height="1400" fill="url(#glow)" />
		<circle cx="150" cy="190" r="230" fill="${warm}" opacity="0.16" />
		<circle cx="1260" cy="1170" r="260" fill="${accent}" opacity="0.16" />
		<g fill="${paper}" font-family="Inter, Avenir Next, Arial, sans-serif" letter-spacing="0">
			${titleSvg}
		</g>
		<text x="700" y="1210" text-anchor="middle" font-family="Inter, Avenir Next, Arial, sans-serif" font-size="42" font-weight="700" fill="${paper}" opacity="0.82" letter-spacing="0">${escapeHtml(config.subtitle)}</text>
		<g>${renderMotif(config)}</g>
		<rect x="58" y="58" width="1284" height="1284" rx="72" fill="none" stroke="${paper}" stroke-width="16" opacity="0.38" />
	</svg>`;
}

await mkdir('public/assets/yoto-art', { recursive: true });
await mkdir('public/assets/yoto-art/display', { recursive: true });

await Promise.all(
	covers.map(async (cover) => {
		const svg = Buffer.from(renderCover(cover));
		const outputPath = join('public/assets/yoto-art', `${cover.id}.png`);
		const displayPath = join('public/assets/yoto-art/display', `${cover.id}.webp`);

		await Promise.all([
			sharp(svg).png({ compressionLevel: 9 }).toFile(outputPath),
			sharp(svg).resize(440, 440).webp({ quality: 76 }).toFile(displayPath),
		]);
	}),
);
