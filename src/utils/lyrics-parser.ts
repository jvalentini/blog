/**
 * Lyrics parsing utilities for the music player.
 * Handles LRC timestamp format and generates HTML with sync data attributes.
 *
 * This module provides pure functions for parsing lyrics content at build time.
 * It supports both timestamped LRC format and plain text lyrics with section headers.
 */

import type { LyricLine, ParsedLyrics } from '../scripts/music-player/types';

/**
 * Escapes HTML special characters to prevent XSS and ensure proper rendering.
 *
 * @param text - The raw text to escape
 * @returns The escaped HTML-safe string
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export const escapeHtml = (text: string): string => {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, (m) => map[m]!);
};

/**
 * Parses an LRC timestamp string into seconds.
 * Supports formats: [MM:SS.xx] or [MM:SS]
 *
 * @param timestamp - The timestamp string without brackets (e.g., "01:23.45")
 * @returns The time in seconds as a floating-point number
 *
 * @example
 * parseTimestamp('01:23.45') // Returns: 83.45
 * parseTimestamp('2:05')     // Returns: 125
 * parseTimestamp('0:00.00')  // Returns: 0
 */
export const parseTimestamp = (timestamp: string): number => {
	const match = timestamp.match(/(\d+):(\d+)(?:\.(\d+))?/);
	if (!match) return 0;
	const minutes = parseInt(match[1]!, 10);
	const seconds = parseInt(match[2]!, 10);
	const centiseconds = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2), 10) : 0;
	return minutes * 60 + seconds + centiseconds / 100;
};

/**
 * Determines if bracket content represents a timestamp vs a section header.
 * Timestamps match the pattern: digits:digits with optional decimal.
 *
 * @param content - The content inside brackets (without the brackets)
 * @returns True if the content is a valid timestamp format
 *
 * @example
 * isTimestamp('01:23.45') // Returns: true
 * isTimestamp('Chorus')   // Returns: false
 * isTimestamp('Verse 1')  // Returns: false
 */
export const isTimestamp = (content: string): boolean => {
	return /^\d+:\d+(?:\.\d+)?$/.test(content);
};

/**
 * Parses lyrics content into structured data with timing information.
 * Generates pre-rendered HTML with data attributes for synchronized display.
 *
 * Supported formats:
 * - LRC timestamps: [MM:SS.xx] or [MM:SS] at line start
 * - Section headers: ## Header or [Section Name]
 * - Empty lines become spacers for visual separation
 * - All other lines are treated as regular lyrics
 *
 * @param content - The raw lyrics content (LRC format or plain text)
 * @returns Parsed lyrics with lines array, timestamp flag, and HTML string
 *
 * @example
 * const lyrics = parseLyrics(`
 * [00:00.00][Intro]
 * [00:05.00]First line of the song
 *
 * ## Chorus
 * [00:30.00]Chorus lyrics here
 * `);
 *
 * lyrics.hasTimestamps // true
 * lyrics.lines[0]      // { time: 0, text: 'Intro', isHeader: true, isSpacer: false }
 */
export const parseLyrics = (content: string): ParsedLyrics => {
	const lines: LyricLine[] = [];
	let hasTimestamps = false;

	// LRC timestamp regex: [MM:SS.xx] or [MM:SS]
	const timestampRegex = /^\[(\d+:\d+(?:\.\d+)?)\]/;
	// Section header regex: [Section Name] (not a timestamp)
	const sectionRegex = /^\[([^\]]+)\]$/;

	const rawLines = content.split('\n');

	for (const rawLine of rawLines) {
		const trimmed = rawLine.trim();

		if (trimmed === '') {
			lines.push({ time: null, text: '', isHeader: false, isSpacer: true });
			continue;
		}

		// Check for LRC timestamp at start of line
		const timestampMatch = trimmed.match(timestampRegex);
		if (timestampMatch) {
			hasTimestamps = true;
			const time = parseTimestamp(timestampMatch[1]!);
			const text = trimmed.slice(timestampMatch[0]!.length).trim();

			// Check if remaining text is a section header [Section Name]
			const remainingSectionMatch = text.match(sectionRegex);
			if (remainingSectionMatch && !isTimestamp(remainingSectionMatch[1]!)) {
				lines.push({ time, text: remainingSectionMatch[1]!, isHeader: true, isSpacer: false });
			} else {
				lines.push({ time, text, isHeader: false, isSpacer: false });
			}
			continue;
		}

		// Check for ## Header format
		if (trimmed.startsWith('## ')) {
			lines.push({ time: null, text: trimmed.slice(3), isHeader: true, isSpacer: false });
			continue;
		}

		// Check for [Section Name] format (not timestamp)
		const sectionMatch = trimmed.match(sectionRegex);
		if (sectionMatch && !isTimestamp(sectionMatch[1]!)) {
			lines.push({ time: null, text: sectionMatch[1]!, isHeader: true, isSpacer: false });
			continue;
		}

		// Regular lyric line
		lines.push({ time: null, text: trimmed, isHeader: false, isSpacer: false });
	}

	// Generate HTML with data attributes for sync
	let html = '';
	lines.forEach((line, idx) => {
		const timeAttr = line.time !== null ? `data-time="${line.time}"` : '';
		const indexAttr = `data-index="${idx}"`;

		if (line.isSpacer) {
			html += `<p class="lyrics-line lyrics-spacer" ${indexAttr}></p>`;
		} else if (line.isHeader) {
			html += `<h3 class="lyrics-header" ${timeAttr} ${indexAttr}>${escapeHtml(line.text)}</h3>`;
		} else if (line.text) {
			html += `<p class="lyrics-line" ${timeAttr} ${indexAttr}>${escapeHtml(line.text)}</p>`;
		}
	});

	return { lines, hasTimestamps, html };
};
