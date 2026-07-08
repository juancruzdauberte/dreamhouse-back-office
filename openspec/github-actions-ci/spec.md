# Spec: github-actions-ci

## Change
**Name**: github-actions-ci
**Input**: openspec/github-actions-ci/proposal.md

---

## Lint Audit (confirmed from `npm run lint`)

### Errors — 8 total (must all pass before CI activates)

| # | File | Line:Col | Type | Context |
|---|------|----------|------|---------|
| E1 | `app/api/event/route.ts` | 38:19 | `catch (error: any)` | Route handler catch block |
| E2 | `app/api/inquiries/diag-airbnb/route.ts` | 90:36 | `filter((r: any) =>` | Debug diagnostic route — `results: object[]` needs inline type |
| E3 | `app/api/test-calendar/route.ts` | 27:19 | `catch (error: any)` | Test/diagnostic route catch block |
| E4 | `app/api/test-db/route.ts` | 8:19 | `catch (error: any)` | Test/diagnostic route catch block |
| E5 | `app/lib/repository/booking/booking.repository.ts` | 21:43 | `pool.execute<any>(...)` | mysql2 INSERT — needs `ResultSetHeader` |
| E6 | `app/lib/services/calendar.service.ts` | 124:19 | `catch (error: any)` | createGoogleCalendarEvent catch |
| E7 | `app/lib/services/calendar.service.ts` | 207:19 | `catch (error: any)` | updateGoogleCalendarEvent catch |
| E8 | `app/lib/services/calendar.service.ts` | 246:19 | `catch (error: any)` | deleteGoogleCalendarEvent catch |

### Warnings — 7 total (non-blocking; do NOT fix in this change)

Warnings live in `booking/route.tsx`, `BookingSearchBar.tsx`, `DeleteBookingButton.tsx`,
`ViewPDFBookingButton.tsx`, and `email-inquiry.service.ts`. They do not block `npm run lint`
exit code and are out of scope for this change.

---

## Build-time env var analysis

`next.config.ts` does not reference any `process.env.*` vars directly.
All env vars (`DB_*`, `NEXTAUTH_*`, `GOOGLE_*`, `IMAP_*`, `ADMIN_EMAIL`) are consumed at
**request time** in server route handlers and server actions — not at build time.

**Conclusion**: `next build` in CI will succeed without secrets injected, as long as no client
component imports server-only code. Current codebase has no such cross-boundary imports.

> **Risk note**: if `NEXTAUTH_SECRET` or `NEXTAUTH_URL` are required by the NextAuth
> middleware config at module-load time during build, the job may fail. The build job MUST
> inject all secrets as env vars to eliminate this risk.

---

## Functional Requirements

### FR-1 — CI Trigger

**MUST** run the pipeline on:
- `push` to every branch (`branches: ['**']`)
- `pull_request` targeting `main`

**MUST NOT** run on tags or release events (out of scope).

---

### FR-2 — Lint Job

**MUST** run `npm run lint` with Node 22.
**MUST** set `continue-on-error: true` so a lint failure does not cancel downstream jobs.
**MUST** set `fail-fast: false` so the build job is independent.
**MUST** cache `~/.npm` keyed to `package-lock.json` hash to reduce cold-start time.
**MUST** run `npm ci` (not `npm install`) for reproducibility.

Exit behavior:
- Lint passes → step succeeds, build starts.
- Lint fails → step is marked failed (visible in GitHub UI) but pipeline continues to build.

---

### FR-3 — Build Job

**MUST** declare `needs: lint` to enforce sequencing (build only after lint completes or fails with `continue-on-error`).
**MUST** run `npm run build` with Node 22.
**MUST** inject all required secrets as environment variables (see FR-3.1).
**MUST** cache `~/.npm` (same key as FR-2).
**MUST** run `npm ci` before build.

A build job failure **MUST** mark the overall workflow as failed.

#### FR-3.1 — Required GitHub Secrets

The following repository secrets MUST be configured in `Settings → Secrets and variables → Actions`:

| Secret | Notes |
|--------|-------|
| `DB_HOST` | Railway hostname |
| `DB_PORT` | Default 3306 |
| `DB_USER` | |
| `DB_PASSWORD` | |
| `DB_DATABASE` | |
| `NEXTAUTH_SECRET` | |
| `NEXTAUTH_URL` | Full URL e.g. `https://dreamhouse.vercel.app` |
| `GOOGLE_CLIENT_ID` | |
| `GOOGLE_CLIENT_SECRET` | |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | **Multiline** — see FR-6 |
| `GOOGLE_CALENDAR_ID` | |
| `IMAP_USER` | Gmail address |
| `IMAP_PASSWORD` | App Password (not account password) |
| `ADMIN_EMAIL` | |

---

### FR-4 — Lint Baseline Cleanup

All 8 errors MUST be fixed before creating the CI workflow file. The pipeline cannot run on a repo
with a dirty lint baseline.

#### FR-4.1 — `app/api/event/route.ts:38`

**Current**: `catch (error: any)`
**Fix**: `catch (error: unknown)` with safe message access:
```ts
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status: 500 });
}
```

#### FR-4.2 — `app/api/inquiries/diag-airbnb/route.ts:90`

**Current**: `results: object[]` → `filter((r: any) => r.isRTB)`
**Fix**: Declare an inline result type for the array, then use it in the filter:
```ts
type DiagResult = { uid: number; subject: string; isRTB: boolean; [key: string]: unknown };
const results: DiagResult[] = [];
// ...
rtbCount: results.filter((r) => r.isRTB).length,
```
This is a diagnostic endpoint; adding an inline type is sufficient — no need for a shared DTO.

#### FR-4.3 — `app/api/test-calendar/route.ts:27`

**Current**: `catch (error: any)`
**Fix**: Same pattern as FR-4.1 — `catch (error: unknown)` with `error instanceof Error`.
This is a diagnostic endpoint; no eslint-disable needed.

#### FR-4.4 — `app/api/test-db/route.ts:8`

**Current**: `catch (error: any)`
**Fix**: Same pattern — `catch (error: unknown)`:
```ts
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ status: "Error", message }, { status: 500 });
}
```

#### FR-4.5 — `app/lib/repository/booking/booking.repository.ts:21`

**Current**: `pool.execute<any>(...)`
**Fix**: Import `ResultSetHeader` from `mysql2` and use it as the generic type parameter.
`ResultSetHeader` is the correct mysql2 type for INSERT/UPDATE/DELETE statements — it exposes
`.insertId`, `.affectedRows`, etc.
```ts
import type { ResultSetHeader } from "mysql2";
// ...
const [result] = await pool.execute<ResultSetHeader>(...);
return result.insertId;
```

#### FR-4.6 — `app/lib/services/calendar.service.ts:124, 207, 246`

**Current**: `catch (error: any)` in three separate catch blocks.
**Fix**: All three MUST use `catch (error: unknown)` with type narrowing:
- Line 124 (`createGoogleCalendarEvent`): `error instanceof Error ? error.message : String(error)` — also fix the `error.code` and `error.response?.status` access on the GaxiosError case.
- Line 207 (`updateGoogleCalendarEvent`): same pattern.
- Line 246 (`deleteGoogleCalendarEvent`): same pattern.

> **Note for line 124**: The catch block checks `error.code === 404` which is a property of
> GaxiosError from googleapis. Fix: `import type { GaxiosError } from "gaxios"` is unnecessary;
> instead use `(error as { code?: number; response?: { status?: number } })` inline narrowing,
> or simply catch as unknown and re-check using `typeof`:
> ```ts
> const err = error as { code?: number; response?: { status?: number }; message?: string };
> if (err.code === 404 || err.response?.status === 404) { ... }
> throw new Error(err.message ?? "Error creando evento");
> ```

---

### FR-5 — Badge in README

**MUST** add a CI status badge to `README.md` pointing to the workflow file.
Format:
```markdown
![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)
```
Badge MUST be placed at the top of the README, before any description paragraphs.

> **Note**: the actual owner/repo must be resolved from `git remote get-url origin` at apply time.

---

### FR-6 — GOOGLE_PRIVATE_KEY Multiline Handling

`GOOGLE_PRIVATE_KEY` contains literal `\n` sequences (e.g. `-----BEGIN RSA PRIVATE KEY-----\nMIIE...`).

**MUST** store it in GitHub Secrets as a single-line string with literal `\n` characters
(the value the code already handles via `.replace(/\\n/g, "\n")`).

**MUST NOT** store it as a multiline PEM block in GitHub Secrets UI — the UI truncates
or mangles multiline values.

In `ci.yml`, the env var injection:
```yaml
env:
  GOOGLE_PRIVATE_KEY: ${{ secrets.GOOGLE_PRIVATE_KEY }}
```
is sufficient. No extra escaping is needed because the existing service code already calls
`.replace(/\\n/g, "\n")` before passing the key to the JWT client.

---

## Scenarios

### SC-1 — Green path: push to feature branch
1. Developer pushes to any branch.
2. Lint runs → 0 errors → step passes.
3. Build runs with secrets → `next build` exits 0.
4. Workflow marked green. Badge updates.

### SC-2 — Lint fails, build still runs
1. Developer introduces a `no-explicit-any` error.
2. Lint runs → errors → step fails with `continue-on-error: true`.
3. Build still runs because lint job completes (even if failed) before build starts via `needs:`.
4. Build result is independent — workflow shows lint as failed, build as passed or failed.

### SC-3 — PR to main
1. PR targeting `main` triggers the pipeline.
2. Both lint and build must pass for the checks to show green.
3. GitHub shows the check status on the PR diff view.

### SC-4 — Missing secret
1. A required secret is not configured in repository settings.
2. `next build` exits with a runtime error during the build job.
3. Workflow marked failed. Developer sees the build log pointing to the missing env var.
4. Fix: add the secret in `Settings → Secrets and variables → Actions`.

### SC-5 — GOOGLE_PRIVATE_KEY mangled
1. Developer stores the key as a multiline block (wrong format).
2. `next build` may succeed (key not used at build time) but runtime will fail on first Google Calendar call.
3. CI correctly passes. This scenario is a runtime risk, not a CI risk.
4. Mitigation: document the single-line format in README or a `SETUP.md`.

---

## Non-Goals (from proposal)

- No deploy to production
- No tests (no test runner configured)
- No Lighthouse / bundle size check
- No external notifications (Slack, email)
- No fix for the 7 existing lint warnings (out of scope)
