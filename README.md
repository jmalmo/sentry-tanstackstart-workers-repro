# Repro: `@sentry/tanstackstart-react` breaks Cloudflare Workers

Minimal reproduction for [getsentry/sentry-javascript#20038](https://github.com/getsentry/sentry-javascript/issues/20038).

## The issue

`@sentry/tanstackstart-react@10.46.0` has `workerd` and `worker` export conditions in `package.json` that resolve to `index.server.js`, which does `export * from '@sentry/node'`. When bundled for Cloudflare Workers — where Nitro's `cloudflare-module` preset automatically sets the `workerd` condition and `noExternals: true` bundles everything — this pulls `@sentry/node` + OpenTelemetry + undici + `node:*` built-ins into the Worker bundle.

No custom `ssr.resolve.conditions` are needed to trigger this — Nitro sets `workerd`/`worker` conditions automatically for the `cloudflare-module` preset.

## Steps to reproduce

```bash
bun install
bun run build:analyze
```

### Output (demonstrating the bug)

```
=== Bundle Analysis ===

PROBLEM: .output/server/_chunks/router-Dcxcq9Jg.mjs (1323 KiB)
  - contains: node:http
  - contains: node:os
  - contains: node:fs
  - contains: node:diagnostics_channel
  - contains: node:zlib
  - contains: undici
  - contains: @opentelemetry/instrumentation

Total server output: 2066 KiB across 12 files

❌ @sentry/node artifacts found in Worker bundle.
```

### Runtime crash (requires wrangler)

```bash
bun run build
bun run preview
# Visit http://localhost:8787 — returns 500 "Cannot initialize ExportedHandler"
```

## Fix verification

Edit `src/router.tsx` — swap the import:

```diff
-import * as Sentry from '@sentry/tanstackstart-react'
+import * as Sentry from '@sentry/react'
```

Then rebuild:

```bash
bun run build:analyze
```

```
=== Bundle Analysis ===

Total server output: 923 KiB across 9 files

✅ No @sentry/node artifacts found — bundle is Workers-safe.
```

Bundle drops from **2,066 KiB** to **923 KiB** and all `node:*` / undici / OpenTelemetry references are gone.

## Key files

- [`vite.config.ts`](vite.config.ts) — Nitro `cloudflare-module` preset with `noExternals: true` (no custom conditions needed)
- [`src/router.tsx`](src/router.tsx) — imports `@sentry/tanstackstart-react` (the problematic import)
- [`scripts/check-bundle.js`](scripts/check-bundle.js) — post-build analysis scanning for `@sentry/node` artifacts

## Environment

| Dependency | Version |
|---|---|
| `@sentry/tanstackstart-react` | ^10.46.0 |
| `@tanstack/react-start` | ~1.166.1 |
| `@tanstack/react-router` | ~1.163.3 |
| `nitro` | ~3.0.260311-beta |
| `vite` | rolldown-vite ^7.3.1 |
| Cloudflare Workers | `nodejs_compat`, compat date `2025-09-01` |
