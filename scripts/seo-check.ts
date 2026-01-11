#!/usr/bin/env bun

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import matter from 'front-matter';

interface ValidationResult {
	file: string;
	errors: string[];
	warnings: string[];
}

interface FrontMatter {
	title?: string;
	description?: string;
	tags?: string[];
	heroImage?: string;
}

const results: ValidationResult[] = [];
let hasErrors = false;

const blogDir = join(process.cwd(), 'src/content/blog');
const files = readdirSync(blogDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

for (const file of files) {
	const result: ValidationResult = {
		file: `src/content/blog/${file}`,
		errors: [],
		warnings: [],
	};

	const content = readFileSync(join(blogDir, file), 'utf-8');
	const { attributes } = matter<FrontMatter>(content);
	const { title, description, tags, heroImage } = attributes;

	if (!title || title.trim() === '') {
		result.errors.push('Missing title');
	}

	if (!description || description.trim() === '') {
		result.errors.push('Missing description');
	}

	if (title && title.length > 70) {
		result.errors.push(`Title too long (${title.length} chars, max 70): "${title}"`);
	}

	if (description && description.length < 100) {
		result.errors.push(`Description too short (${description.length} chars, min 100)`);
	}

	if (description && description.length > 170) {
		result.errors.push(`Description too long (${description.length} chars, max 170)`);
	}

	if (!tags || tags.length === 0) {
		result.warnings.push("No tags defined (post won't appear in related posts or tag archives)");
	}

	if (!heroImage) {
		result.warnings.push('No hero image (social sharing will use default image)');
	}

	if (result.errors.length > 0 || result.warnings.length > 0) {
		results.push(result);
		if (result.errors.length > 0) {
			hasErrors = true;
		}
	}
}

if (results.length === 0) {
	console.log('✅ All blog posts pass SEO validation!');
	process.exit(0);
}

console.log('\n📊 SEO Validation Results\n');

for (const result of results) {
	console.log(`📄 ${result.file}`);

	if (result.errors.length > 0) {
		console.log('  ❌ Errors:');
		for (const error of result.errors) {
			console.log(`     - ${error}`);
		}
	}

	if (result.warnings.length > 0) {
		console.log('  ⚠️  Warnings:');
		for (const warning of result.warnings) {
			console.log(`     - ${warning}`);
		}
	}

	console.log('');
}

const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

console.log(`\n📈 Summary: ${errorCount} errors, ${warningCount} warnings across ${results.length} files\n`);

if (hasErrors) {
	console.log('❌ SEO validation failed. Fix errors above before deploying.\n');
	process.exit(1);
} else {
	console.log('✅ SEO validation passed (warnings are informational only).\n');
	process.exit(0);
}
