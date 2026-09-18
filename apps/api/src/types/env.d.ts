// SESSION_SECRET is a real secret and deliberately not declared in
// wrangler.jsonc's `vars` (which `wrangler types` would otherwise pick
// up automatically) — see wrangler.jsonc's comment. This file merges
// it into the same Cloudflare.Env interface by hand instead.
//
// No top-level import/export here on purpose: that keeps this a
// global ambient script file, so a plain `declare namespace` merges
// directly into worker-configuration.d.ts's global `Cloudflare`
// namespace. A file with module syntax needs `declare global` to do
// the same (see test/env.d.ts for that case).
declare namespace Cloudflare {
  interface Env {
    SESSION_SECRET: string
  }
}
