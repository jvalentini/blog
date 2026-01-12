#!/usr/bin/env bun
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Rate limiting: track last request time
let lastRequestTime = 0;

/**
 * Extract prompt text from lyrics markdown content.
 * Removes frontmatter, headers, and section markers.
 */
function extractLyricsPrompt(content: string): string {
	// Remove frontmatter
	content = content.replace(/^---[\s\S]*?---\n/, '');

	// Remove markdown headers and section markers
	content = content.replace(/^#+\s.*$/gm, '');
	content = content.replace(/^\[.*?\]\s*$/gm, '');

	// Clean up extra whitespace
	content = content.trim();

	return content;
}

/**
 * Generate music using Suno's API
 */
async function generateMusic(lyricsFile: string, style?: string) {
	// Read and process lyrics file
	let lyricsContent: string;
	try {
		lyricsContent = await fs.readFile(lyricsFile, 'utf-8');
	} catch (error) {
		console.error(`❌ Failed to read lyrics file: ${lyricsFile}`);
		console.error('Error:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}

	const prompt = extractLyricsPrompt(lyricsContent);

	// Read style if it's a file path (starts with @)
	let styleText = style;
	if (styleText && styleText.startsWith('@')) {
		const styleFile = styleText.slice(1);
		try {
			styleText = await fs.readFile(styleFile, 'utf-8');
		} catch (error) {
			console.error(`❌ Failed to read style file: ${styleFile}`);
			console.error('Error:', error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	}

	// Default title to lyrics filename without extension
	const title = path.basename(lyricsFile, path.extname(lyricsFile));

	// Rate limiting: 1 request per 10 seconds
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;
	if (timeSinceLastRequest < 10000) {
		const waitTime = Math.ceil((10000 - timeSinceLastRequest) / 1000);
		console.log(`⏳ Rate limiting: waiting ${waitTime}s...`);
		await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
	}
	lastRequestTime = Date.now();

	// Get API key from environment (can be JWT token directly or extracted from cookies)
	let apiKey = process.env.SUNO_API_KEY;
	const cookies = process.env.SUNO_COOKIES;

	if (!apiKey && cookies) {
		const sessionMatch = cookies.match(/__session=([^;]+)/);
		if (sessionMatch) {
			apiKey = sessionMatch[1];
		}
	}

	if (!apiKey) {
		console.error('❌ SUNO_API_KEY or SUNO_COOKIES environment variable not set');
		console.error('   Set SUNO_API_KEY to your JWT token, or');
		console.error('   Set SUNO_COOKIES to your browser cookies string');
		process.exit(1);
	}

	// Prepare request data matching the curl example
	const requestData = {
		token: null,
		generation_type: 'TEXT',
		title: title,
		tags:
			styleText ||
			'emotional cinematic pop-rap duet. Intense raw angry male rap verses with fast intricate flows full of frustration and regret, alternating with lush haunting female sung chorus of soulful powerful emotive vocals conveying grief and resignation.',
		negative_tags: '',
		mv: 'chirp-crow',
		prompt: prompt,
		make_instrumental: false,
		user_uploaded_images_b64: null,
		metadata: {
			web_client_pathname: '/create',
			is_max_mode: false,
			is_mumble: false,
			create_mode: 'custom',
			user_tier: '3eaebef3-ef46-446a-931c-3d50cd1514f1',
			create_session_token: crypto.randomUUID(),
			disable_volume_normalization: false,
			can_control_sliders: ['weirdness_constraint', 'style_weight'],
		},
		override_fields: [],
		cover_clip_id: null,
		cover_start_s: null,
		cover_end_s: null,
		persona_id: null,
		artist_clip_id: null,
		artist_start_s: null,
		artist_end_s: null,
		continue_clip_id: null,
		continued_aligned_prompt: null,
		continue_at: null,
		transaction_uuid: crypto.randomUUID(),
	};

	console.log('🎵 Generating music from lyrics...');
	console.log(`Lyrics file: ${lyricsFile}`);
	console.log(`Title: ${title}`);
	if (styleText) console.log(`Style: ${styleText.length > 50 ? styleText.slice(0, 50) + '...' : styleText}`);

	try {
		const response = await fetch('https://studio-api.prod.suno.com/api/generate/v2-web/', {
			method: 'POST',
			headers: {
				accept: '*/*',
				'accept-language': 'en-US,en;q=0.9',
				authorization: `Bearer ${apiKey}`,
				'browser-token': `{"token":"${Date.now()}"}`,
				'device-id': crypto.randomUUID(),
				origin: 'https://suno.com',
				priority: 'u=1, i',
				referer: 'https://suno.com/',
				'sec-ch-ua': '"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"Windows"',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-site',
				'sec-gpc': '1',
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
				'content-type': 'application/json',
			},
			body: JSON.stringify(requestData),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`❌ API Error ${response.status}:`, errorText);
			process.exit(1);
		}

		const result = (await response.json()) as { data?: { task_id?: string } };
		console.log('✅ Generation started!');
		console.log(`Task ID: ${result.data?.task_id}`);
		console.log('🎵 Generation initiated. Check Suno website for results.');
	} catch (error) {
		console.error('❌ Request failed:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

// CLI argument parsing
function parseArgs() {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.error('Usage: bun run scripts/suno-generate.ts <lyrics-file> [style]');
		console.error('');
		console.error('Arguments:');
		console.error('  lyrics-file    Path to markdown lyrics file');
		console.error('  style          Optional style description or @file for file path');
		console.error('');
		console.error('Environment:');
		console.error('  SUNO_API_KEY   JWT token from Suno (the __session cookie value)');
		console.error('  SUNO_COOKIES   Full cookie string from browser (alternative to SUNO_API_KEY)');
		process.exit(1);
	}

	const lyricsFile = args[0];
	const style = args[1];

	return { lyricsFile, style };
}

// Main execution
async function main() {
	const { lyricsFile, style } = parseArgs();
	if (!lyricsFile) {
		throw new Error('Lyrics file is required');
	}
	await generateMusic(lyricsFile, style);
}

main().catch((error) => {
	console.error('❌ Unexpected error:', error);
	process.exit(1);
});
