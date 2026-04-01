# Repro: `@sentry/tanstackstart-react` crashes Cloudflare Workers

Minimal reproduction for [getsentry/sentry-javascript#20038](https://github.com/getsentry/sentry-javascript/issues/20038).

## The issue

`@sentry/tanstackstart-react@10.46.0` has `workerd` and `worker` export conditions that resolve to `index.server.js`, which does `export * from '@sentry/node'`. When bundled for Cloudflare Workers (Nitro `cloudflare-module` preset, `noExternals: true`), this pulls `@sentry/node` + its full dependency tree into the Worker bundle, causing a runtime crash: `Error: No such module "node:fs"`.

## Steps to reproduce

```bash
bun install
bun run build
bun run preview
# Visit http://localhost:8787 → HTTP 500
# Wrangler logs: Error: No such module "node:fs", imported from router chunk
```

### Result comparison

| Config | Router chunk | `wrangler dev` | HTTP |
|---|---|---|---|
| No Sentry | 25 KiB | Works | **200** |
| `@sentry/tanstackstart-react` | 1,324 KiB | `No such module "node:fs"` | **500** |
| `@sentry/react` | 183 KiB | Works | **200** |

## Verify: remove Sentry to confirm baseline works

Comment out the Sentry import in `src/router.tsx`:

```diff
-import * as Sentry from '@sentry/tanstackstart-react'
+// import * as Sentry from '@sentry/tanstackstart-react'
```

(Also comment out the `Sentry.init(...)` block.)

```bash
bun run build && bun run preview
# Visit http://localhost:8787 → HTTP 200 ✅
```

## Verify: swap to `@sentry/react` to confirm fix

```diff
-import * as Sentry from '@sentry/tanstackstart-react'
+import * as Sentry from '@sentry/react'
```

```bash
bun run build && bun run preview
# Visit http://localhost:8787 → HTTP 200 ✅
```

## Bundle analysis (optional)

```bash
bun run build:analyze
```

Shows the `@sentry/node` artifacts (`node:http`, `node:os`, `node:fs`, `undici`, `@opentelemetry/instrumentation`) in the Worker bundle.

## Key files

- [`vite.config.ts`](vite.config.ts) — Nitro `cloudflare-module` preset, `noExternals: true`
- [`src/router.tsx`](src/router.tsx) — imports `@sentry/tanstackstart-react` (the crash trigger)
- [`scripts/check-bundle.js`](scripts/check-bundle.js) — post-build bundle analysis

## Environment

| Dependency | Version |
|---|---|
| `@sentry/tanstackstart-react` | ^10.46.0 |
| `@tanstack/react-start` | ~1.166.1 |
| `@tanstack/react-router` | ~1.163.3 |
| `nitro` | ~3.0.260311-beta |
| `vite` | rolldown-vite ^7.3.1 |
| `wrangler` | ^4.0.0 |
| Cloudflare Workers | `nodejs_compat`, compat date `2025-09-01` |
