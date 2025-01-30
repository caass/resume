// @ts-check
import { defineConfig, envField } from "astro/config";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],
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
