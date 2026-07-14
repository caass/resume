// @ts-check
import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";

import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import pdf from "astro-pdf";

// Merge .env files with process.env — prefix "" loads every key, not just
// VITE_-prefixed ones. Covers both the Nix build (contact vars injected into
// process.env, no .env in the sandbox) and pnpm/npm (Astro loads .env but
// doesn't put it on process.env). `vite` is a direct dependency pinned to the
// same range Astro uses, so this dedupes to Astro's own vite (see package.json).
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");

// True if `key` has a non-empty value in that merged env: a var the Nix build
// injects, or a non-empty .env assignment.
/** @param {string} key */
function contactSet(key) {
  return Boolean(env[key]);
}

// Warn (without failing) when the optional contact details are missing, so a
// build doesn't silently ship a resume with no way to reach you. Runs in the
// build pipeline via astro:build:start, so it fires however you build — pnpm,
// npm, or nix.
function warnMissingContact() {
  return {
    name: "warn-missing-contact",
    hooks: {
      /** @param {{ logger: { warn: (msg: string) => void } }} ctx */
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
        "/": {
          path: "resume.pdf",
          ensurePath: true,
          throwOnFail: true,
          isolated: true,
          pdf: { margin: { top: 30 } },
        },
      },
    }),
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
