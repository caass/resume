# Resume

I got sick and tired of having to re-learn Microsoft Word's archaic system for columns, spacing, and padding every time I started job hunting. "Wait," I though to myself, "I already _know_ an archiac system for columns, spacing and padding! It's called Cascading Style Sheets!" And thus, I rewrote my entire resume into JSX.

This repository contains both the contents and the layout of my resume, written using [Astro](https://astro.build) and rendered to PDF using [Puppeteer](https://pptr.dev) (via [astro-pdf](https://github.com/lameuler/astro-pdf)). The resume content itself lives in MDX and YAML files, which Astro ingests and renders into a static page before Puppeteer converts it to PDF.

## Building

With [Node](https://nodejs.org) (npm ships with it): `npm install && npm run build` writes `dist/resume.pdf` and opens it.

Or with [Nix](https://nixos.org) — no Node needed on the host:

- `nix build .` → `result/resume.pdf`
- `nix run .` → the Astro dev server
- `nix develop` → a shell with the toolchain (or `direnv allow`)

The Nix build renders with a browser from the store (chromium on Linux; unfree `google-chrome` on macOS), so it never downloads its own copy.

P.S. If you find the contents of this resume enticing, shoot me an email! You can contact me through my website, [swag.LGBT](https://swag.lgbt).

P.P.S. If you want to re-use this project for your own resume, feel free to fork. There's definitely better resume builders out there, however.
