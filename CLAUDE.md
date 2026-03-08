# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An Astro-based resume site that renders to PDF via Puppeteer (astro-pdf). Single-page resume with positions in MDX, skills in YAML, and automated PDF output.

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Build site and open generated `dist/resume.pdf`

No lint or test commands are configured.

## Architecture

**Entry point:** `src/pages/index.astro` — Fetches all content collections, sorts/groups positions by section → org → role, and renders the full resume.

**Content collections** (defined in `src/content/content.config.ts`):

- `positions/` — MDX files with frontmatter: `section` (experience|education|research), `org`, `from`, `to` (date or "Present"), optional `role`. Body is bullet-point content rendered as HTML.
- `skills.yaml` — Array of `{id, category, items[]}`.

**Components:** `Section`, `Org`, `Position` form the hierarchy. `ArrowLink`, `ContactLink`, `IconLink`, `Skill` are leaf components.

**Environment variables** (`PHONE_NUMBER`, `EMAIL_ADDRESS`): Optional, server-context only. Defined in `.env` and schema'd in `astro.config.mjs`. Contact links render conditionally based on presence.

## Key Details

- **Package manager:** pnpm
- **PDF generation:** Configured in `astro.config.mjs` via astro-pdf/Puppeteer with 30px top margin
- **Font:** Atkinson Hyperlegible (@fontsource)
- **Icons:** Lucide via astro-icon
- **Styling:** Component-scoped CSS, CSS subgrid for skills layout
- **Use `trash` instead of `rm -r`** for deleting files/directories
