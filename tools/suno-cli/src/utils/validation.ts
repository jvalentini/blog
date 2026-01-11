import type { GenerateRequest } from '../types.js';

export function validateGenerateRequest(req: GenerateRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!req.prompt || req.prompt.trim().length === 0) {
    errors.push('prompt is required and cannot be empty');
  }

  if (req.prompt && req.prompt.length > 5000) {
    errors.push('prompt must be less than 5000 characters');
  }

  if (req.title && req.title.length > 200) {
    errors.push('title must be less than 200 characters');
  }

  if (req.style && req.style.length > 100) {
    errors.push('style must be less than 100 characters');
  }

  if (req.negativeTags && req.negativeTags.length > 1000) {
    errors.push('negativeTags must be less than 1000 characters');
  }

  if (req.vocalGender && !['m', 'f'].includes(req.vocalGender)) {
    errors.push('vocalGender must be "m" or "f"');
  }

  if (req.styleWeight !== undefined && (req.styleWeight < 0 || req.styleWeight > 1)) {
    errors.push('styleWeight must be between 0 and 1');
  }

  if (req.weirdnessConstraint !== undefined && (req.weirdnessConstraint < 0 || req.weirdnessConstraint > 1)) {
    errors.push('weirdnessConstraint must be between 0 and 1');
  }

  if (req.audioWeight !== undefined && (req.audioWeight < 0 || req.audioWeight > 1)) {
    errors.push('audioWeight must be between 0 and 1');
  }

  if (req.callBackUrl) {
    try {
      new URL(req.callBackUrl);
    } catch {
      errors.push('callBackUrl must be a valid URL');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.SUNO_API_KEY && !require('../config.js').configManager.getApiKey()) {
    errors.push('SUNO_API_KEY environment variable or config file API key is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
