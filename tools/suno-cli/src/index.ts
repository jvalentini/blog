#!/usr/bin/env bun
import { Command } from 'commander';
import { configManager } from './config.js';
import { validateEnvironment } from './utils/validation.js';
import { createGenerateCommand } from './commands/generate.js';
import { createStatusCommand } from './commands/status.js';

const program = new Command();

program
  .name('suno')
  .description('CLI tool for Suno API integration')
  .version('1.0.0');

// Global options
program
  .option('--api-key <key>', 'Suno API key')
  .option('--base-url <url>', 'Suno API base URL')
  .option('--timeout <ms>', 'Request timeout in milliseconds', parseInt)
  .option('--max-retries <num>', 'Maximum number of retries', parseInt)
  .option('--retry-delay <ms>', 'Initial retry delay in milliseconds', parseInt)
  .option('--backoff-multiplier <num>', 'Backoff multiplier', parseFloat)
  .option('--use-playwright', 'Enable Playwright for token refresh')
  .option('--playwright-headless', 'Run Playwright in headless mode')
  .option('--playwright-timeout <ms>', 'Playwright timeout in milliseconds', parseInt);

// Config command
program
  .command('config')
  .description('Manage CLI configuration')
  .option('--show', 'Show current configuration')
  .option('--set-api-key <key>', 'Set API key')
  .option('--reset', 'Reset configuration to defaults')
  .action(async (options) => {
    try {
      if (options.show) {
        const config = configManager.getConfig();
        console.log('Current configuration:');
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      if (options.setApiKey) {
        await configManager.setApiKey(options.setApiKey);
        console.log('✅ API key updated');
        return;
      }

      if (options.reset) {
        // Reset to defaults by updating with empty object
        await configManager.updateConfig({});
        console.log('✅ Configuration reset to defaults');
        return;
      }

      console.log('Use --show to view config, --set-api-key to set API key, or --reset to reset config');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate environment and configuration')
  .action(async () => {
    try {
      console.log('🔍 Validating environment...');

      const envValidation = validateEnvironment();
      if (!envValidation.valid) {
        console.error('❌ Environment validation failed:');
        envValidation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      console.log('✅ Environment validation passed');

      console.log('🔍 Validating configuration...');
      const configValidation = configManager.validate();
      if (!configValidation.valid) {
        console.error('❌ Configuration validation failed:');
        configValidation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      console.log('✅ Configuration validation passed');
      console.log('🎉 All validations passed!');

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add subcommands
program.addCommand(createGenerateCommand());
program.addCommand(createStatusCommand());

// Global error handling
program.exitOverride();

// Apply global options
program.hook('preAction', async (thisCommand) => {
  const options = thisCommand.opts();

  // Update config with global options
  const updates: any = {};
  if (options.apiKey) updates.apiKey = options.apiKey;
  if (options.baseUrl) updates.baseUrl = options.baseUrl;
  if (options.timeout) updates.timeout = options.timeout;
  if (options.maxRetries !== undefined) updates.maxRetries = options.maxRetries;
  if (options.retryDelay !== undefined) updates.retryDelay = options.retryDelay;
  if (options.backoffMultiplier) updates.backoffMultiplier = options.backoffMultiplier;
  if (options.usePlaywright !== undefined) updates.usePlaywright = options.usePlaywright;
  if (options.playwrightHeadless !== undefined) {
    updates.playwrightConfig = {
      ...configManager.getConfig().playwrightConfig,
      headless: options.playwrightHeadless,
    };
  }
  if (options.playwrightTimeout) {
    updates.playwrightConfig = {
      ...configManager.getConfig().playwrightConfig,
      timeout: options.playwrightTimeout,
    };
  }

  if (Object.keys(updates).length > 0) {
    await configManager.updateConfig(updates);
  }
});

// Parse arguments
program.parseAsync().catch((error) => {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
