# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Astro-based resume that renders to PDF. Resume content lives in YAML files; Astro builds a static HTML page, then Puppeteer (via `astro-pdf`) converts it to a PDF at `dist/resume.pdf`.

## Commands

This project uses a Nix flake devshell — enter it with `nix develop` (or automatically via direnv). The supported build mechanism is `just build`.

- `just build` — Build `result/resume.pdf`, with contact details from `.env` baked in.
- `just` — List available recipes.
- `pnpm dev` — Build once, then rebuild on file changes (watches `src/`).
- `pnpm astro check` — TypeScript type checking.

No test suite exists.

### How the build works

`just build` runs `set -a; . ./.env; set +a; nix build --impure`: it exports the vars in `.env`, then builds the PDF reproducibly in a hermetic Nix derivation.

Contact details (`PHONE_NUMBER`/`EMAIL_ADDRESS`) live in the gitignored `.env`. A pure Nix build can't read untracked files, so the flake reads the two vars via `builtins.getEnv` — empty under the default pure eval, real under `--impure`, which is why `just build` exports `.env` first — and injects only the ones that are set into the derivation's `env`, whence Astro's `loadEnv(mode, dir, "")` picks them up from `process.env` (the fields are optional, so a build without them just omits that contact info). A missing var is warned about (never fatal) on two layers: the `warnMissingContact` integration in `astro.config.ts` fires during the build itself (its in-sandbox log surfaces only with `-L` or on failure), and `flake.nix` additionally emits an eval-time `lib.warnIf` that always reaches the terminal. `loadEnv` is imported from `vite`, which is a direct dependency **pinned to the same range Astro uses** (see `package.json`) so pnpm dedupes it to Astro's own vite instead of installing a second copy — keep the two ranges in sync when upgrading Astro.

The flake supplies the browser from the Nix store (chromium on Linux, unfree `google-chrome` on macOS where chromium isn't packaged) and points `astro-pdf` at it via `PUPPETEER_EXECUTABLE_PATH`; `.puppeteerrc.cjs` stops Puppeteer from downloading its own. On macOS the derivation exports `CFFIXED_USER_HOME` and launches Chrome with `--use-mock-keychain` so headless Chrome can start inside the Nix builder's homeless daemon-user environment. `pnpm` is pinned to v10 (`fetchPnpmDeps` `fetcherVersion = 3`); the `pnpm.configHook` deprecation warning during the build is expected and harmless.

`nix run .` starts the Astro dev server against the working tree; `nix develop` drops into a devshell with `node`, `pnpm`, `just`, and a browser on `PATH`.

## Environment Variables

Optional env vars defined in `astro.config.ts` via `envField`:

- `PHONE_NUMBER` (number) — phone number shown on resume
- `EMAIL_ADDRESS` (string) — email shown on resume

These are server-side, sourced from `.env`.

## Architecture

**Content collections** (`src/content.config.ts`):

- `positions` — Single YAML file at `src/content/positions.yaml`, loaded via `file()`. Each entry is an org with `id`, `section` (experience/education/research), `org`, `from`, `to`, and a `positions` array; each nested position has an optional `role` and a `bullets` array. A bullet is either a plain string or a list of segments — a string segment is literal text, an object segment `{ text, href, em? }` renders as an `ArrowLink` (`em: true` italicizes it). This replaces the former per-position MDX files; bullet links are structured data rather than inline markdown.
- `skills` — Single YAML file at `src/content/skills.yaml` with `category` and `items` arrays.

**Rendering pipeline** (`src/pages/raw.astro`):

- Orgs (and their positions) are grouped in the data itself; the page just splits by section (experience → research → education) and orders orgs most-recent-first. `Position.astro` renders each bullet's segments, emitting `ArrowLink` for linked segments.
- The page is a single-page layout (`src/layouts/Layout.astro`) using Atkinson Hyperlegible font, max-width 40rem.

**PDF generation** (`astro-pdf` integration in `astro.config.ts`):

- Converts the `/` route to `resume.pdf` with a 30px top margin.

## Adding Content

To add a new position, edit `src/content/positions.yaml`: add a new org entry, or append to an existing org's `positions` array. Give links as `{ text, href }` bullet segments. To add skills, edit `src/content/skills.yaml`.
