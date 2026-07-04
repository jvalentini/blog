MISE_AVAILABLE := $(shell command -v mise 2>/dev/null)
ifdef MISE_AVAILABLE
	CMD_PREFIX = mise exec --
else
	CMD_PREFIX =
endif

.PHONY: setup lint check test seo build links ci

setup:
	@$(CMD_PREFIX) bun install --frozen-lockfile

lint:
	@$(CMD_PREFIX) bun run lint:check

check:
	@$(CMD_PREFIX) bun run check

test:
	@$(CMD_PREFIX) bun test

seo:
	@$(CMD_PREFIX) bun run seo:check

build:
	@$(CMD_PREFIX) bun run build

links:
	@$(CMD_PREFIX) bun run links:check

ci: lint check test seo build
