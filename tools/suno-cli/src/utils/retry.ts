import { backOff } from 'exponential-backoff';
import type { RetryOptions } from '../types.js';

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, retryDelay, backoffMultiplier, retryCondition } = options;

  return backOff(operation, {
    numOfAttempts: maxRetries + 1, // +1 because numOfAttempts includes the initial attempt
    startingDelay: retryDelay,
    timeMultiple: backoffMultiplier,
    retry: retryCondition || ((error: Error) => {
      // Default retry condition: retry on network errors, 5xx status codes, rate limits
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return true; // Network errors
      }

      if (error.message.includes('429')) {
        return true; // Rate limit
      }

      if (error.message.includes('5')) {
        return true; // 5xx server errors
      }

      return false;
    }),
  });
}

export function createRetryOptions(
  maxRetries?: number,
  retryDelay?: number,
  backoffMultiplier?: number
): RetryOptions {
  const { configManager } = require('../config.js');

  const config = configManager.getConfig();

  return {
    maxRetries: maxRetries ?? config.maxRetries,
    retryDelay: retryDelay ?? config.retryDelay,
    backoffMultiplier: backoffMultiplier ?? config.backoffMultiplier,
  };
}
