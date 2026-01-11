import type { APIRoute, GetStaticPaths } from 'astro';
import tracksData from '../../data/tracks.json';

interface Song {
	id: string;
	title: string;
	lyrics: Record<string, string>;
	versions: Record<string, string>;
}

interface TracksConfig {
	songs: Song[];
	genres: string[];
	defaultGenre: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
	const config = tracksData as TracksConfig;

	return config.songs.map((song) => ({
		params: { slug: song.id },
		props: { trackTitle: song.title },
	}));
};

export const GET: APIRoute = async ({ params, props, site }) => {
	const siteUrl = site?.origin ?? 'https://jvalentini.pages.dev';
	const slug = params.slug;
	const title = (props as { trackTitle: string }).trackTitle;
	const embedUrl = `${siteUrl}/embed/${slug}`;

	const oembedResponse = {
		version: '1.0',
		type: 'rich',
		provider_name: 'jvalentini',
		provider_url: siteUrl,
		title: title,
		author_name: 'jvalentini',
		author_url: siteUrl,
		html: `<iframe src="${embedUrl}" width="480" height="200" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
		width: 480,
		height: 200,
		thumbnail_url: `${siteUrl}/waves-hero.png`,
		thumbnail_width: 1200,
		thumbnail_height: 630,
	};

	return new Response(JSON.stringify(oembedResponse, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};
