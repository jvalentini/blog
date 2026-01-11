import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { sunoAPI } from '../api.js';
import { validateGenerateRequest } from '../utils/validation.js';
import type { GenerateRequest } from '../types.js';

// Rate limiting state
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
 * Get the timestamp of the last API request for rate limiting.
 */
function getLastRequestTime(): number {
	return lastRequestTime;
}

/**
 * Update the timestamp of the last API request.
 */
function setLastRequestTime(time: number): void {
	lastRequestTime = time;
}

export function createGenerateCommand(): Command {
	const command = new Command('generate');

	command
		.description('Generate music using Suno API from lyrics file')
		.requiredOption('-l, --lyrics <file>', 'Path to lyrics markdown file')
		.option('-s, --style <style>', 'Music style (text or @file for file path)')
		.option('-t, --title <title>', 'Song title (defaults to lyrics filename)')
		.option('--instrumental', 'Generate instrumental music')
		.option('--model <model>', 'AI model to use', 'V4_5ALL')
		.option('--callback-url <url>', 'Callback URL for completion notifications')
		.option('--persona-id <id>', 'Persona ID for consistent style')
		.option('--negative-tags <tags>', 'Tags to avoid in generation')
		.option('--vocal-gender <gender>', 'Vocal gender (m/f)', (value) => {
			if (!['m', 'f'].includes(value)) {
				throw new Error('Vocal gender must be "m" or "f"');
			}
			return value;
		})
		.option('--style-weight <weight>', 'Style weight (0-1)', parseFloat)
		.option('--weirdness-constraint <constraint>', 'Weirdness constraint (0-1)', parseFloat)
		.option('--audio-weight <weight>', 'Audio weight (0-1)', parseFloat)
		.option('--custom-mode', 'Enable custom mode')
		.option('--no-wait', 'Do not wait for generation (just start and exit)')
		.action(async (options) => {
			try {
				// Read lyrics file and extract content for prompt
				let lyricsContent: string;
				try {
					lyricsContent = await fs.readFile(options.lyrics, 'utf-8');
				} catch (error) {
					console.error(`❌ Failed to read lyrics file: ${options.lyrics}`);
					console.error('Error:', error instanceof Error ? error.message : String(error));
					process.exit(1);
				}

				const prompt = extractLyricsPrompt(lyricsContent);

				// Handle style input (text or @file syntax)
				let styleText = options.style;
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

				const defaultTitle = path.basename(options.lyrics, path.extname(options.lyrics));

				const request: GenerateRequest = {
					prompt: prompt,
					title: options.title || defaultTitle,
					style: styleText,
					instrumental: options.instrumental,
					model: options.model,
					callBackUrl: options.callbackUrl,
					personaId: options.personaId,
					negativeTags: options.negativeTags,
					vocalGender: options.vocalGender,
					styleWeight: options.styleWeight,
					weirdnessConstraint: options.weirdnessConstraint,
					audioWeight: options.audioWeight,
					customMode: options.customMode,
				};

				// Validate request
				const validation = validateGenerateRequest(request);
				if (!validation.valid) {
					console.error('❌ Validation errors:');
					validation.errors.forEach((error) => console.error(`  - ${error}`));
					process.exit(1);
				}

				console.log('🎵 Generating music from lyrics...');
				console.log(`Lyrics file: ${options.lyrics}`);
				console.log(`Title: ${request.title}`);
				if (request.style)
					console.log(`Style: ${request.style.length > 50 ? request.style.slice(0, 50) + '...' : request.style}`);

				// Rate limiting: 1 request per 10 seconds
				const lastRequestTime = getLastRequestTime();
				const timeSinceLastRequest = Date.now() - lastRequestTime;
				if (timeSinceLastRequest < 10000) {
					const waitTime = 10000 - timeSinceLastRequest;
					console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime / 1000)}s...`);
					await new Promise((resolve) => setTimeout(resolve, waitTime));
				}
				setLastRequestTime(Date.now());

				const response = await sunoAPI.generateMusic(request);

				if (response.code !== 200) {
					console.error(`❌ API Error: ${response.msg}`);
					process.exit(1);
				}

				console.log('✅ Generation started!');
				console.log(`Task ID: ${response.data?.task_id}`);

				if (!options.noWait && response.data?.task_id) {
					console.log('\n⏳ Waiting for completion...');
					await waitForCompletion(response.data.task_id, 300); // Default 5 minutes
				} else {
					console.log('🎵 Generation initiated. Check Suno website for results.');
				}
			} catch (error) {
				console.error('❌ Error:', error instanceof Error ? error.message : String(error));
				process.exit(1);
			}
		});

	return command;
}

async function waitForCompletion(taskId: string, maxWaitSeconds: number): Promise<void> {
	const ora = (await import('ora')).default;
	const cliProgress = await import('cli-progress');

	const startTime = Date.now();
	const maxWaitMs = maxWaitSeconds * 1000;
	let attempts = 0;

	// Create progress bar for overall time
	const progressBar = new cliProgress.SingleBar({
		format: '⏳ Waiting | {bar} | {percentage}% | ETA: {eta}s | Elapsed: {duration}s',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true,
	});

	progressBar.start(maxWaitSeconds, 0);

	const spinner = ora('Checking generation status...').start();

	while (Date.now() - startTime < maxWaitMs) {
		attempts++;
		const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

		try {
			spinner.text = `Checking generation status... (attempt ${attempts}, ${elapsedSeconds}s elapsed)`;
			const status = await sunoAPI.getTaskStatus(taskId);

			if (status.code === 200 && status.data?.callbackType === 'complete') {
				progressBar.stop();
				spinner.succeed('Generation completed!');

				if (status.data.data && status.data.data.length > 0) {
					console.log('\n🎶 Final tracks:');
					status.data.data.forEach((track, index) => {
						console.log(`\nTrack ${index + 1}:`);
						console.log(`  ID: ${track.id}`);
						console.log(`  Title: ${track.title}`);
						console.log(`  Audio URL: ${track.audio_url}`);
						console.log(`  Stream URL: ${track.stream_audio_url}`);
						console.log(`  Duration: ${track.duration}s`);
						console.log(`  Tags: ${track.tags}`);
					});
				}
				return;
			}

			// Update progress bar
			const progressPercent = Math.min((elapsedSeconds / maxWaitSeconds) * 100, 100);
			progressBar.update(elapsedSeconds);

			spinner.text = `Status: ${status.msg || 'Processing...'} (${elapsedSeconds}s elapsed)`;
			await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			spinner.warn(`Status check failed: ${errorMsg}`);
			await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds on error
			spinner.start();
		}
	}

	progressBar.stop();
	spinner.fail(`Timeout: Generation did not complete within ${maxWaitSeconds} seconds`);
	console.log(`Task ID: ${taskId} (use 'suno status ${taskId}' to check later)`);
}
