#!/usr/bin/env bun
import { promises as fs } from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';

const MUSIC_DIR = 'public/assets/music';
const LYRICS_DIR = 'src/content/lyrics';
const TRACKS_JSON = 'src/data/tracks.json';

interface TrackInfo {
	title: string;
	lyrics: string;
}

type TracksMap = Record<string, TrackInfo>;

function generateSlug(filename: string): string {
	return filename
		.replace(/\.(mp3|wav)$/i, '')
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function generateTitle(filename: string): string {
	return filename
		.replace(/\.(mp3|wav)$/i, '')
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

async function fileExists(filepath: string): Promise<boolean> {
	try {
		await fs.access(filepath);
		return true;
	} catch {
		return false;
	}
}

async function loadTracks(): Promise<TracksMap> {
	try {
		const content = await fs.readFile(TRACKS_JSON, 'utf-8');
		return JSON.parse(content);
	} catch {
		return {};
	}
}

async function saveTracks(tracks: TracksMap): Promise<void> {
	const content = JSON.stringify(tracks, null, 2) + '\n';
	await fs.writeFile(TRACKS_JSON, content, 'utf-8');
}

async function main() {
	const { values, positionals } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			file: { type: 'string', short: 'f' },
			lyrics: { type: 'string', short: 'l' },
			title: { type: 'string', short: 't' },
			help: { type: 'boolean', short: 'h' },
			'dry-run': { type: 'boolean', short: 'n' },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: bun run scripts/add-track.ts --file <mp3-path> [options]

Options:
  -f, --file <path>     Path to the MP3 file (required)
  -l, --lyrics <path>   Path to the lyrics markdown file (optional)
  -t, --title <title>   Human-readable title (auto-generated from filename if not provided)
  -n, --dry-run         Show what would be done without making changes
  -h, --help            Show this help message

Examples:
  bun run scripts/add-track.ts -f ~/Downloads/my-song.mp3
  bun run scripts/add-track.ts -f ~/Downloads/my-song.mp3 -l ~/Downloads/lyrics.md
  bun run scripts/add-track.ts -f ~/Downloads/my-song.mp3 -t "My Amazing Song"
`);
		process.exit(0);
	}

	const audioFile = values.file || positionals[0];
	if (!audioFile) {
		console.error('Error: --file is required');
		process.exit(1);
	}

	const dryRun = values['dry-run'] ?? false;
	const audioPath = path.resolve(audioFile);

	if (!(await fileExists(audioPath))) {
		console.error(`Error: Audio file not found: ${audioPath}`);
		process.exit(1);
	}

	const originalFilename = path.basename(audioPath);
	const slug = generateSlug(originalFilename);
	const title = values.title || generateTitle(originalFilename);
	const targetAudioFilename = `${slug}.mp3`;
	const targetAudioPath = path.join(MUSIC_DIR, targetAudioFilename);
	const targetLyricsFilename = `${slug}.md`;
	const targetLyricsPath = path.join(LYRICS_DIR, targetLyricsFilename);

	console.log('\n📀 Add Track');
	console.log('─'.repeat(40));
	console.log(`  Source:     ${audioPath}`);
	console.log(`  Slug:       ${slug}`);
	console.log(`  Title:      ${title}`);
	console.log(`  Audio dest: ${targetAudioPath}`);

	if (values.lyrics) {
		const lyricsPath = path.resolve(values.lyrics);
		if (!(await fileExists(lyricsPath))) {
			console.error(`Error: Lyrics file not found: ${lyricsPath}`);
			process.exit(1);
		}
		console.log(`  Lyrics src: ${lyricsPath}`);
		console.log(`  Lyrics dst: ${targetLyricsPath}`);
	}

	console.log('');

	if (dryRun) {
		console.log('🔍 Dry run - no changes made\n');
		return;
	}

	await fs.mkdir(MUSIC_DIR, { recursive: true });
	await fs.mkdir(LYRICS_DIR, { recursive: true });

	console.log(`📁 Copying audio to ${targetAudioPath}...`);
	await fs.copyFile(audioPath, targetAudioPath);

	let lyricsFile = '';
	if (values.lyrics) {
		const lyricsPath = path.resolve(values.lyrics);
		console.log(`📝 Copying lyrics to ${targetLyricsPath}...`);
		await fs.copyFile(lyricsPath, targetLyricsPath);
		lyricsFile = targetLyricsFilename;
	}

	console.log(`📋 Updating ${TRACKS_JSON}...`);
	const tracks = await loadTracks();
	tracks[slug] = { title, lyrics: lyricsFile };
	await saveTracks(tracks);

	console.log('\n✅ Track added successfully!');
	console.log(`\n   View at: /waves/${slug}`);
	console.log(`   Embed:   /embed/${slug}`);
	console.log(`   oEmbed:  /oembed/${slug}.json\n`);
}

main().catch((err) => {
	console.error('Error:', err.message);
	process.exit(1);
});
