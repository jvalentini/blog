import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SunoConfig } from './types.js';

const CONFIG_FILE = join(homedir(), '.suno-cli.json');

export class ConfigManager {
  private config: SunoConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SunoConfig {
    const defaultConfig: SunoConfig = {
      baseUrl: 'https://api.sunoapi.org/api/v1',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      usePlaywright: false,
      playwrightConfig: {
        headless: true,
        timeout: 60000,
      },
    };

    if (existsSync(CONFIG_FILE)) {
      try {
        const fileConfig = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        return { ...defaultConfig, ...fileConfig };
      } catch (error) {
        console.warn(`Warning: Failed to parse config file ${CONFIG_FILE}:`, error);
      }
    }

    return defaultConfig;
  }

  getConfig(): SunoConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<SunoConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }

  private async saveConfig(): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error(`Error saving config to ${CONFIG_FILE}:`, error);
    }
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.baseUrl) {
      errors.push('baseUrl is required');
    }

    if (this.config.timeout < 1000) {
      errors.push('timeout must be at least 1000ms');
    }

    if (this.config.maxRetries < 0) {
      errors.push('maxRetries must be non-negative');
    }

    if (this.config.retryDelay < 0) {
      errors.push('retryDelay must be non-negative');
    }

    if (this.config.backoffMultiplier <= 1) {
      errors.push('backoffMultiplier must be greater than 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getApiKey(): string | undefined {
    return this.config.apiKey || process.env.SUNO_API_KEY;
  }

  async setApiKey(apiKey: string): Promise<void> {
    this.updateConfig({ apiKey });
  }
}

export const configManager = new ConfigManager();
