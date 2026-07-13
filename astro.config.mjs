// @ts-check
import { defineConfig, envField } from "astro/config";

import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import pdf from "astro-pdf";

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
