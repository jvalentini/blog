# Suno CLI

A clean, well-structured CLI tool for Suno API integration with proper error handling, configuration management, and modular code.

## Features

- 🎵 **Music Generation**: Generate music using Suno API with custom prompts
- 🔄 **Retry Logic**: Exponential backoff retry with configurable parameters
- 🎭 **Playwright Integration**: Automatic token refresh using browser automation
- ⚙️ **Configuration Management**: Persistent config with environment variable support
- ✅ **Input Validation**: Comprehensive validation for requests and environment
- 📊 **Status Monitoring**: Real-time task status checking with watch mode
- 🏗️ **Modular Architecture**: Clean separation of concerns

## Installation

```bash
# From the blog root directory
bun install
```

## Configuration

### Environment Variables

```bash
export SUNO_API_KEY="your-api-key-here"
```

### Config File

The CLI creates `~/.suno-cli.json` for persistent configuration:

```bash
# Set API key
./src/index.ts config --set-api-key "your-api-key"

# View current config
./src/index.ts config --show

# Reset to defaults
./src/index.ts config --reset
```

## Usage

### Validate Setup

```bash
# Validate environment and configuration
./src/index.ts validate
```

### Generate Music

```bash
# Basic generation
./src/index.ts generate -p "A calm piano melody for meditation"

# Advanced options
./src/index.ts generate \
  --prompt "Upbeat electronic dance music" \
  --title "Summer Vibes" \
  --style "Electronic" \
  --instrumental \
  --model "V4_5ALL" \
  --wait \
  --max-wait 600

# With custom parameters
./src/index.ts generate \
  --prompt "Jazz improvisation" \
  --style-weight 0.8 \
  --weirdness-constraint 0.3 \
  --vocal-gender f
```

### Check Task Status

```bash
# One-time status check
./src/index.ts status "task-id-here"

# Watch for completion
./src/index.ts status "task-id-here" --watch --interval 10
```

### Global Options

```bash
# Override config for single command
./src/index.ts --api-key "temp-key" --max-retries 5 generate -p "test prompt"

# Use Playwright for authentication
./src/index.ts --use-playwright --playwright-headless generate -p "test"
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | - | Suno API key |
| `baseUrl` | `https://api.sunoapi.org/api/v1` | API base URL |
| `timeout` | `30000` | Request timeout (ms) |
| `maxRetries` | `3` | Maximum retry attempts |
| `retryDelay` | `1000` | Initial retry delay (ms) |
| `backoffMultiplier` | `2` | Exponential backoff multiplier |
| `usePlaywright` | `false` | Enable Playwright authentication |
| `playwrightConfig.headless` | `true` | Run browser headless |
| `playwrightConfig.timeout` | `60000` | Browser timeout (ms) |

## Error Handling

The CLI includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Rate Limits**: Respects 429 responses with appropriate delays
- **Server Errors**: Retries on 5xx status codes
- **Validation**: Input validation with helpful error messages
- **Authentication**: Token refresh via Playwright when enabled

## Architecture

```
src/
├── index.ts          # CLI entry point
├── types.ts          # TypeScript interfaces
├── config.ts         # Configuration management
├── api.ts            # Suno API client
├── auth.ts           # Authentication handling
├── utils/
│   ├── retry.ts      # Retry logic
│   └── validation.ts # Input validation
└── commands/
    ├── generate.ts   # Music generation command
    └── status.ts     # Status checking command
```

## Development

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests (when implemented)
bun run test
```

## License

MIT
