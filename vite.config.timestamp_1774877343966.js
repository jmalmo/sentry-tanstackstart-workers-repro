// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
var vite_config_default = defineConfig({
  build: {
    rollupOptions: {
      external: ["fsevents"]
    }
  },
  ssr: {
    external: ["fsevents"],
    resolve: {
      // Standard conditions for Cloudflare Workers.
      // 'workerd' is the WinterCG runtime key for Cloudflare Workers.
      // This causes @sentry/tanstackstart-react to resolve its 'workerd'
      // export condition → index.server.js → re-exports @sentry/node.
      conditions: ["workerd", "worker", "browser", "import", "module", "default"]
    }
  },
  plugins: [
    tanstackStart(),
    nitro({
      preset: "cloudflare-module",
      noExternals: true,
      // Workers has no node_modules — bundle everything
      rollupConfig: {
        output: {
          plugins: [
            {
              name: "nitro:cloudflare-guard-createRequire",
              generateBundle(_options, bundle) {
                for (const chunk of Object.values(bundle)) {
                  if (chunk.type === "chunk" && chunk.code) {
                    chunk.code = chunk.code.replaceAll(
                      "createRequire(import.meta.url)",
                      'createRequire(import.meta.url||"file:///")'
                    );
                  }
                }
              }
            }
          ]
        }
      }
    }),
    react()
  ],
  resolve: {
    alias: {
      "react-dom/server": "react-dom/server.node"
    }
  }
});
export {
  vite_config_default as default
};
