# List available recipes.
list:
    just --list

# Build the PDF with contact info from .env baked in
build:
    set -a; . ./.env; set +a; nix build --impure

# Live-reloading PDF preview in the browser (serves the resume at / and opens it)
dev:
    set -a; . ./.env 2>/dev/null; set +a; pnpm exec astro dev --open
