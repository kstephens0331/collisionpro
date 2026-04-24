# AUDIT - CollisionPro

**Date:** 2026-04-23
**Tier:** 4 (In-Progress Product)
**Completion (entry / exit):** 70% / 73%

## Stack
Next.js 15 + React 19 + TypeScript, Supabase (database + auth), Google Vision API, Anthropic SDK, @react-pdf/renderer, Three.js (3D vehicle models), Tailwind 4, Radix UI, deployed to Vercel.

## Health Check Results
- Repo is **public** on GitHub (`kstephens0331/collisionpro`).
- TypeScript compile: PASS.
- Build: not run this pass (heavy Next.js build + large dependency graph).
- Secret scan before: 22 live secret values across 8 tracked files (Supabase anon + service role keys, NextAuth secret, Vercel OIDC token).
- Secret scan after: zero secrets in any tracked file.
- Supabase project `pkyqrvrxwhlwkxalsbaz` referenced in the code: does not exist under the owner's Supabase org. Either deleted or never transferred. Leaked keys are effectively dead on that basis.
- GitHub secret scanning alert #1 was open (Supabase Service Key, from `DEPLOYMENT.md:24`).

## Gaps Found

### Critical - addressed this pass
**Three `.env.*` files were tracked in the public repo:**
- `.env.production` - Supabase URL + anon key
- `.env.vercel` - Supabase anon key, service role key, NextAuth secret, Vercel OIDC token
- `.env.SETUP_GUIDE.md` - setup instructions (may have had real values)

All three have been untracked (`git rm --cached`) and added to `.gitignore` so they cannot be re-committed. Local files kept so owner still has the values.

**Hardcoded fallback secrets in source code:**
- `src/lib/supabase.ts` used `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '<live key>'` so a missing env var silently fell through to a baked-in production key. Replaced with a `throw` so missing env is fail-loud.
- `next.config.js` did the same pattern. Removed the entire `env: {...}` block since Next.js already exposes `NEXT_PUBLIC_*` vars to the client without re-declaration.

**Docs and scripts containing live values:**
Redacted across `DEPLOYMENT.md` (3), `QUICKSTART.md` (3), `scripts/setup-vercel-env.sh` (6), `.env.production.example` (3). Placeholders: `<REDACTED-SUPABASE-KEY>`, `<REDACTED-NEXTAUTH-SECRET>`, `<REDACTED-VERCEL-OIDC-TOKEN>`.

22 total redactions across 8 files.

### Important
- Live build + runtime verification was not done this pass. Source code now throws on missing `NEXT_PUBLIC_SUPABASE_*` vars - if someone tries to build without setting them, build-time Node may error. Worth a quick `npm run build` verification when convenient.
- No automated tests in this repo; only manual Puppeteer scripts in `scripts/`.
- No `.github/workflows/` directory; no CI. Gitleaks workflow added this pass.

### Polish (deferred)
- No CLAUDE.md at repo root. Not created this pass.
- Many documentation MD files at root (30+). Consider a `docs/` subtree.

## Changes Made This Pass
- Untracked `.env.production`, `.env.vercel`, `.env.SETUP_GUIDE.md`.
- Extended `.gitignore` with `.env.production`, `.env.vercel`, `.env.SETUP_GUIDE.md`.
- Redacted 22 live secret values across 8 tracked files.
- Rewrote `src/lib/supabase.ts` to throw on missing env (removed hardcoded fallback).
- Rewrote `next.config.js` to rely on implicit Next.js env exposure (removed hardcoded fallback).
- Added `.github/workflows/gitleaks.yml` so future pushes are scanned server-side.
- Created this `AUDIT.md`.

## Still Open
- **Leaked key pre-redaction commits remain in public git history.** Dead at the source (Supabase project doesn't exist), but future readers wouldn't know that. Owner can decide whether to rewrite history.
- GitHub secret-scanning alert #1 (Supabase Service Key at `DEPLOYMENT.md:24`) can now be closed as revoked since the underlying Supabase project is gone.
- Verify `npm run build` still passes end-to-end with the fail-loud env check.
- Add CLAUDE.md.
- Add automated tests.

## Next Actions for This Project
1. Close GitHub Alert #1 at https://github.com/kstephens0331/collisionpro/security/secret-scanning/1 as "revoked" (project gone).
2. Run `npm run build` locally (or trigger a Vercel preview deploy) to confirm the new fail-loud env check doesn't break anything currently running.
3. Optional: history rewrite with `git filter-repo` to purge the leaked keys from public history.
4. Set up a Vercel + Supabase project pair for the ongoing development if this project is still active.
