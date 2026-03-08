# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Astro-based resume that renders to PDF. Resume content lives in MDX and YAML files; Astro builds a static HTML page, then Puppeteer (via `astro-pdf`) converts it to a PDF at `dist/resume.pdf`.

## Commands

- `pnpm build` — Build the site and open the resulting PDF
- `pnpm dev` — Build once, then rebuild on file changes (watches `src/`)
- `pnpm astro check` — TypeScript type checking

No test suite exists.

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
