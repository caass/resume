# List available recipes.
list:
    just --list

# Build the PDF with contact info from .env baked in
build:
    set -a; . ./.env; set +a; nix build --impure
