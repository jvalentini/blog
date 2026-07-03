import { getImage } from 'astro:assets';
import type { APIRoute, GetStaticPaths } from 'astro';
import wavesHeroImage from '../../assets/waves-hero.png';
import tracksData from '../../data/tracks.json';
import type { AudioVersionMap } from '../../utils/audio-assets';

interface Song {
	id: string;
	title: string;
	lyrics: Record<string, string | undefined>;
	versions: AudioVersionMap;
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

	// Get optimized image URL for thumbnail
	const thumbnailImage = await getImage({ src: wavesHeroImage, width: 1200, height: 630 });
	const thumbnailUrl = new URL(thumbnailImage.src, siteUrl).href;

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
		thumbnail_url: thumbnailUrl,
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
