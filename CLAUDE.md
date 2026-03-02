# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A resume built as an Astro web application that renders to PDF via Puppeteer. The source is `.astro` components; the final output is `dist/resume.pdf`.

## Commands

- **Dev server:** `pnpm dev` — starts Astro dev server with hot reload
- **Build:** `pnpm build` — builds static HTML then renders PDF via Puppeteer, opens the result
- **Type check:** `pnpm astro check` (uses strict tsconfig extending `astro/tsconfigs/strict`)

Package manager is **pnpm**.

## Architecture

**Build pipeline:** Astro components → static HTML → Puppeteer renders to PDF (via `astro-pdf` integration configured in `astro.config.mjs`).

**Component hierarchy:**
- `src/layouts/Layout.astro` — root HTML shell, global styles, Atkinson Hyperlegible font
- `src/pages/index.astro` — the single page; assembles header/contact info and resume sections
- `src/components/Section.astro` — titled section wrapper (Experience, Education, etc.)
- `src/components/Org.astro` — organization entry with date range (uses `Intl.DateTimeFormat`)
- `src/components/Position.astro` — role within an org, renders bullet-point achievements via slot
- `src/components/Skill.astro` — skill category, uses CSS Grid subgrid
- `src/components/IconLink.astro` / `ContactLink.astro` — links with Lucide icons

**Env vars** (optional, server-side only, configured in `astro.config.mjs`):
- `PHONE_NUMBER` — 10-digit number, formatted as (XXX) XXX-XXXX by `ContactLink`
- `EMAIL_ADDRESS` — email string

If not set, `ContactLink` renders nothing.

## Key Details

- All styling is component-scoped `<style>` blocks; no external CSS files
- Icons come from `@iconify-json/lucide` via `astro-icon`; icon names are whitelisted in `astro.config.mjs`
- PDF settings (margins, etc.) are in the `astro-pdf` config within `astro.config.mjs`
- The skills section uses CSS `subgrid` for alignment across skill categories
