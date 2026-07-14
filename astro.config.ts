import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";

import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import pdf from "astro-pdf";
import puppeteer, { type Browser, type Page } from "puppeteer";

import type { AstroIntegration } from "astro";

// Merge .env files with process.env — prefix "" loads every key, not just
// VITE_-prefixed ones. Covers both the Nix build (contact vars injected into
// process.env, no .env in the sandbox) and pnpm/npm (Astro loads .env but
// doesn't put it on process.env). `vite` is a direct dependency pinned to the
// same range Astro uses, so this dedupes to Astro's own vite (see package.json).
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");

// True if `key` has a non-empty value in that merged env: a var the Nix build
// injects, or a non-empty .env assignment.
function contactSet(key: string): boolean {
  return Boolean(env[key]);
}

// Warn (without failing) when the optional contact details are missing, so a
// build doesn't silently ship a resume with no way to reach you. Runs in the
// build pipeline via astro:build:start, so it fires however you build — pnpm,
// npm, or nix.
function warnMissingContact(): AstroIntegration {
  return {
    name: "warn-missing-contact",
    hooks: {
      "astro:build:start": ({ logger }) => {
        const missing = ["PHONE_NUMBER", "EMAIL_ADDRESS"].filter(
          (k) => !contactSet(k),
        );
        if (missing.length > 0) {
          logger.warn(
            `${missing.join(" and ")} not set — the PDF will omit that contact info.`,
          );
        }
      },
    },
  };
}

// When PUPPETEER_EXECUTABLE_PATH is set (Nix build/devShell), point astro-pdf at
// that browser and disable Chrome's sandbox so it launches inside the Nix build
// sandbox. Unset (plain `pnpm dev`/`build`), Puppeteer uses its own browser.
const pdfExecutable = process.env.PUPPETEER_EXECUTABLE_PATH;
const launch = pdfExecutable
  ? { executablePath: pdfExecutable, args: ["--no-sandbox", "--use-mock-keychain"] }
  : undefined;

// Top PDF margin, shared so the dev preview matches the built PDF.
const pdfMargin = { top: 30 };

// Dev-only: make `astro dev` preview the actual PDF instead of the HTML. `/` is
// a thin iframe wrapper (src/pages/index.astro) pointing at `/resume.pdf`; this
// middleware renders that PDF on demand from `/raw` (the resume HTML astro-pdf
// turns into resume.pdf for the build), mirroring astro-pdf's `waitUntil`/margin
// so the preview matches. Puppeteer is imported at the top of this file rather
// than lazily in the hook: Astro loads a TypeScript config through a short-lived
// Vite module runner that it closes the moment it has read the config, so a
// deferred `import()` here would hit an already-closed runner. A top-level import
// resolves while that runner is still open and is captured in the closure — and
// it costs nothing, since astro-pdf pulls puppeteer in on every build regardless.
// Any change under src/ triggers a full reload, which re-requests — and so
// re-renders — the PDF.
function pdfPreview(): AstroIntegration {
  return {
    name: "pdf-preview",
    hooks: {
      "astro:server:setup": ({ server, logger }) => {
        let browser: Browser | undefined;
        const getBrowser = async () => {
          if (!browser?.connected) browser = await puppeteer.launch(launch ?? {});
          return browser;
        };

        server.middlewares.use(async (req, res, next) => {
          const origin = `http://${req.headers.host}`;
          if (new URL(req.url ?? "/", origin).pathname !== "/resume.pdf") {
            return next();
          }
          let page: Page | undefined;
          try {
            page = await (await getBrowser()).newPage();
            await page.goto(new URL("/raw", origin).href, {
              waitUntil: "networkidle2",
            });
            const buf = await page.pdf({ margin: pdfMargin });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Cache-Control", "no-store");
            res.end(Buffer.from(buf));
          } catch (err) {
            const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
            logger.error(`render failed\n${detail}`);
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain");
            res.end(`PDF render failed:\n${detail}`);
          } finally {
            await page?.close().catch(() => {});
          }
        });

        // `/` doesn't import the resume content, so content edits wouldn't reload
        // it on their own. Broadcast a full reload on any src change; the wrapper
        // reloads and re-fetches /resume.pdf.
        const reload = () => (server.hot ?? server.ws)?.send({ type: "full-reload" });
        server.watcher.on("change", (path) => {
          if (path.includes("/src/")) reload();
        });

        const close = () => browser?.close().catch(() => {});
        server.httpServer?.once("close", close);
        process.once("exit", close);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    warnMissingContact(),
    mdx(),
    icon({
      include: {
        lucide: [
          "linkedin",
          "github",
          "smartphone",
          "mail",
          "square-arrow-out-up-right",
        ],
      },
    }),
    pdf({
      ...(launch ? { launch } : {}),
      pages: {
        // The resume HTML lives at /raw; / is the dev PDF-preview wrapper.
        "/raw": {
          path: "resume.pdf",
          ensurePath: true,
          throwOnFail: true,
          isolated: true,
          pdf: { margin: pdfMargin },
        },
      },
    }),
    pdfPreview(),
  ],
  env: {
    schema: {
      PHONE_NUMBER: envField.number({
        context: "server",
        access: "public",
        optional: true,
      }),
      EMAIL_ADDRESS: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
});
