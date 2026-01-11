# Suno Song Generator

A minimal CLI script for generating songs using Suno AI from lyrics files.

## Setup

1. Get a Suno API key from [sunoapi.org](https://sunoapi.org)
2. Set the environment variable:
   ```bash
   export SUNO_API_KEY=your_api_key_here
   ```
   Or add it to your `.env` file:
   ```
   SUNO_API_KEY=your_api_key_here
   ```

## Usage

```bash
# Basic usage with lyrics file
bun run scripts/suno-generate.ts -l examples/suno/sample-lyrics.md

# With style description
bun run scripts/suno-generate.ts -l examples/suno/sample-lyrics.md -s "pop rock"

# With style from file
bun run scripts/suno-generate.ts -l examples/suno/sample-lyrics.md --style-file examples/suno/sample-style.txt

# Full options
bun run scripts/suno-generate.ts \
  -l examples/suno/sample-lyrics.md \
  --style-file examples/suno/sample-style.txt \
  -t "AI Developer Anthem" \
  -w 0.3 \
  --instrumental

# Dry run (no API calls)
bun run scripts/suno-generate.ts -l examples/suno/sample-lyrics.md --dry-run
```

## Options

- `-l, --lyrics <file>`: Path to lyrics file (required)
- `-s, --style <text>`: Style description
- `--style-file <file>`: Path to style file
- `-t, --title <title>`: Song title
- `-w, --weirdness <0-1>`: Weirdness constraint (0.0-1.0)
- `-i, --instrumental`: Generate instrumental only
- `-m, --model <model>`: AI model (default: V4_5)
- `-n, --dry-run`: Show what would be done without API calls
- `-h, --help`: Show help

## Lyrics Format

Lyrics should be in plain text or markdown format with sections:

```
[Verse 1]
Your verse lyrics here
Line by line

[Chorus]
Chorus lyrics
More lines

[Verse 2]
Second verse
Etc.
```

## Rate Limiting

The script implements rate limiting of 1 request per 10 seconds to be respectful to the API.

## Output

On success, the script will output:
- Song title
- Duration
- Audio URL for download
- Track ID

## Error Handling

The script includes basic error handling for:
- Missing API key
- File not found
- Invalid parameters
- API errors
- Generation timeouts (5 minutes max)
