import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['fsevents'],
    },
  },
  ssr: {
    external: ['fsevents'],
    // No explicit ssr.resolve.conditions — Nitro's cloudflare-module preset
    // automatically adds 'workerd' and 'worker' conditions, which causes
    // @sentry/tanstackstart-react to resolve its workerd export condition
    // → index.server.js → re-exports @sentry/node.
  },
  plugins: [
    tanstackStart(),
    // This is the only config that matters for the repro:
    // cloudflare-module preset + noExternals bundles everything into the Worker,
    // and Nitro automatically sets workerd/worker conditions.
    nitro({
      preset: 'cloudflare-module',
      noExternals: true,
      alias: {
        'react-dom/server': 'react-dom/server.node',
      },
      rollupConfig: {
        output: {
          plugins: [
            {
              // Workaround: rolldown-vite emits createRequire(import.meta.url) but
              // import.meta.url is undefined on Workers. Guard with fallback.
              // Upstream: https://github.com/nicolo-ribaudo/tc39-proposal-esm-phase-imports/issues/1
              name: 'nitro:cloudflare-bundle-fixes',
              generateBundle(_options, bundle) {
                for (const chunk of Object.values(bundle)) {
                  if (chunk.type === 'chunk' && chunk.code) {
                    // Fix 1: createRequire(import.meta.url) — import.meta.url is
                    // undefined on Workers.
                    chunk.code = chunk.code.replaceAll(
                      'createRequire(import.meta.url)',
                      'createRequire(import.meta.url||"file:///")',
                    )
                    // Fix 2: rolldown drops the CJS→ESM interop variable for
                    // jsx-runtime in small builds. Inject it if missing.
                    if (
                      chunk.code.includes('import_jsx_runtime') &&
                      !chunk.code.includes('var import_jsx_runtime')
                    ) {
                      chunk.code = chunk.code.replace(
                        /^(import \{[^}]*__toESM[^}]*require_jsx_runtime[^}]*\}[^;]*;)/m,
                        '$1\nvar import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());',
                      )
                    }
                  }
                }
              },
            },
          ],
        },
      },
    }) as PluginOption,
    react(),
  ],
  resolve: {
    alias: {
      'react-dom/server': 'react-dom/server.node',
    },
  },
})
