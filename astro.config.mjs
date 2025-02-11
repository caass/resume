// @ts-check
import { defineConfig, envField } from "astro/config";

import icon from "astro-icon";

import pdf from "astro-pdf";

// https://astro.build/config
export default defineConfig({
  integrations: [
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
      pages: {
        "/": {
          path: "resume.pdf",
          ensurePath: true,
          throwOnFail: true,
          isolated: true,
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
