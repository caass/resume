# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Astro-based resume that renders to PDF. Resume content lives in MDX and YAML files; Astro builds a static HTML page, then Puppeteer (via `astro-pdf`) converts it to a PDF at `dist/resume.pdf`.

## Commands

- `pnpm build` — Build the site and open the resulting PDF
- `pnpm dev` — Build once, then rebuild on file changes (watches `src/`)
- `pnpm astro check` — TypeScript type checking

No test suite exists.

### Nix

A flake (`flake.nix`) packages the whole toolchain, so neither `node` nor `pnpm` need to be installed on the host.

- `nix build .` — Build `result/resume.pdf` reproducibly in a hermetic derivation.
- `nix run .` — Start the Astro dev server against the working tree.
- `nix develop` — Drop into a shell with `node`, `pnpm`, and a browser on `PATH` (the `.envrc` runs this automatically under direnv).

The build supplies the browser from the Nix store (chromium on Linux, unfree `google-chrome` on macOS where chromium isn't packaged) and points `astro-pdf` at it via `PUPPETEER_EXECUTABLE_PATH`; `.puppeteerrc.cjs` stops Puppeteer from downloading its own. On macOS the derivation exports `CFFIXED_USER_HOME` and launches Chrome with `--use-mock-keychain` so headless Chrome can start inside the Nix builder's homeless daemon-user environment. `pnpm` is pinned to v10 (`fetchPnpmDeps` `fetcherVersion = 3`); the `pnpm.configHook` deprecation warning during the build is expected and harmless.

## Environment Variables

Optional env vars defined in `astro.config.mjs` via `envField`:

- `PHONE_NUMBER` (number) — phone number shown on resume
- `EMAIL_ADDRESS` (string) — email shown on resume

These are server-side, sourced from `.env`.

## Architecture

**Content collections** (`src/content.config.ts`):

- `positions` — MDX files in `src/content/positions/`, each with frontmatter: `section` (experience/education/research), `org`, `from`, `to`, and optional `role`. Multiple positions can share the same org and date range to group under one org heading.
- `skills` — Single YAML file at `src/content/skills.yaml` with `category` and `items` arrays.

**Rendering pipeline** (`src/pages/index.astro`):

- Positions are grouped by section (experience → research → education), then by org identity (org name + date range). Links in MDX content render via the `ArrowLink` component.
- The page is a single-page layout (`src/layouts/Layout.astro`) using Atkinson Hyperlegible font, max-width 40rem.

**PDF generation** (`astro-pdf` integration in `astro.config.mjs`):

- Converts the `/` route to `resume.pdf` with a 30px top margin.

## Adding Content

To add a new position, create a `.mdx` file in `src/content/positions/` with the required frontmatter schema. To add skills, edit `src/content/skills.yaml`.
