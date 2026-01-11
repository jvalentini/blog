import { chromium } from 'playwright';
import type { AuthTokens, SunoConfig } from './types.js';
import { configManager } from './config.js';

export class AuthManager {
  private tokens: AuthTokens | null = null;
  private config: SunoConfig;

  constructor() {
    this.config = configManager.getConfig();
  }

  async refreshTokenWithPlaywright(): Promise<string> {
    if (!this.config.usePlaywright) {
      throw new Error('Playwright authentication is not enabled in config');
    }

    console.log('🔄 Refreshing token using Playwright...');

    const browser = await chromium.launch({
      headless: this.config.playwrightConfig?.headless ?? true,
    });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to Suno login page
      await page.goto('https://suno.ai/login', {
        waitUntil: 'networkidle',
        timeout: this.config.playwrightConfig?.timeout ?? 60000,
      });

      // This is a placeholder - actual login implementation would depend on Suno's auth flow
      // You would need to:
      // 1. Fill in login credentials
      // 2. Handle 2FA if required
      // 3. Extract tokens from localStorage/sessionStorage or network requests

      throw new Error('Playwright token refresh not fully implemented - requires Suno login flow analysis');

    } finally {
      await browser.close();
    }
  }

  getToken(): string | undefined {
    const apiKey = configManager.getApiKey();
    if (apiKey) {
      return apiKey;
    }

    if (this.tokens && this.isTokenValid()) {
      return this.tokens.accessToken;
    }

    return undefined;
  }

  private isTokenValid(): boolean {
    if (!this.tokens) return false;

    if (this.tokens.expiresAt) {
      return Date.now() < this.tokens.expiresAt;
    }

    return true; // Assume valid if no expiry
  }

  async ensureValidToken(): Promise<string> {
    let token = this.getToken();

    if (!token) {
      if (this.config.usePlaywright) {
        token = await this.refreshTokenWithPlaywright();
        this.tokens = {
          accessToken: token,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        };
      } else {
        throw new Error('No API key available. Set SUNO_API_KEY environment variable or enable Playwright authentication');
      }
    }

    return token;
  }
}

export const authManager = new AuthManager();
