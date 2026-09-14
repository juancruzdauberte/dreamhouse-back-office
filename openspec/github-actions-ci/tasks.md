# Tasks: github-actions-ci

## Change
**Name**: github-actions-ci
**Inputs**: openspec/github-actions-ci/spec.md, openspec/github-actions-ci/design.md

---

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| Archivos modificados | 8 |
| Líneas cambiadas (est.) | ~71 (+79 / -8) |
| Dentro del budget (400 líneas) | ✅ |
| Estrategia PR | Single PR |
| Reviewer recomendado | `review-reliability` (comportamiento de catch blocks) |

---

## Implementation Tasks

### Phase A — Lint baseline cleanup (pre-condición)

- [ ] **T-01** Fix `app/api/event/route.ts:38` — cambiar `catch (error: any)` por `catch (error: unknown)` con narrowing `error instanceof Error ? error.message : String(error)`. Actualizar el `return NextResponse.json({ error: message })`.

- [ ] **T-02** Fix `app/api/inquiries/diag-airbnb/route.ts:90` — agregar tipo inline `DiagResult = { uid: number; subject: string; isRTB: boolean; [key: string]: unknown }` antes del array `results`, cambiar `results: object[]` a `results: DiagResult[]`, eliminar `(r: any)` del filter.

- [ ] **T-03** Fix `app/api/test-calendar/route.ts:27` — cambiar `catch (error: any)` por `catch (error: unknown)` con narrowing. El response JSON tiene `error.message` y `error.stack`; usar `error instanceof Error ? error.message : String(error)` y `error instanceof Error ? error.stack : undefined`.

- [ ] **T-04** Fix `app/api/test-db/route.ts:8` — cambiar `catch (error: any)` por `catch (error: unknown)` con narrowing. El response JSON tiene `{ status: "Error", message: error.message }`.

- [ ] **T-05** Fix `app/lib/repository/booking/booking.repository.ts:21` — agregar `import type { ResultSetHeader } from "mysql2"` al principio del archivo (junto a los imports existentes de mysql2). Cambiar `pool.execute<any>(...)` por `pool.execute<ResultSetHeader>(...)`.

- [ ] **T-06** Fix `app/lib/services/calendar.service.ts:124` (catch de `createGoogleCalendarEvent`) — cambiar `catch (error: any)` por `catch (error: unknown)`. El catch accede a `error.code`, `error.response?.status`, y `error.message`; usar un cast inline `const err = error as { code?: number; response?: { status?: number }; message?: string }` antes de usarlos. Cambiar `throw new Error(error.message || ...)` por `throw new Error(err.message ?? ...)`.

- [ ] **T-07** Fix `app/lib/services/calendar.service.ts:207` (catch de `updateGoogleCalendarEvent`) — cambiar `catch (error: any)` por `catch (error: unknown)` + narrowing. El return es `{ success: false, message: error.message }`.

- [ ] **T-08** Fix `app/lib/services/calendar.service.ts:246` (catch de `deleteGoogleCalendarEvent`) — cambiar `catch (error: any)` por `catch (error: unknown)` + narrowing. El return es `{ success: false, message: error.message }`.

- [ ] **T-09** Verificar lint limpio — correr `npm run lint` y confirmar **0 errors**. Las 7 warnings existentes son aceptables y no deben ser tocadas.

---

### Phase B — CI workflow

- [ ] **T-10** Crear directorio `.github/workflows/` si no existe y crear `.github/workflows/ci.yml` con el contenido exacto del diseño:
  - `on: push branches: ["**"]` + `pull_request branches: [main]`
  - Job `lint`: `ubuntu-latest`, `continue-on-error: true`, Node 22, cache npm, `npm ci`, `npm run lint`
  - Job `build`: `ubuntu-latest`, `needs: lint`, Node 22, cache npm, `npm ci`, `npm run build`, env con los 15 secrets

- [ ] **T-11** Agregar badge CI en `README.md` — insertar en la línea inmediatamente debajo del heading `# 🏡 Dreamhouse Back-Office`:
  ```
  [![CI](https://github.com/juancruzdauberte/dreamhouse-back-office/actions/workflows/ci.yml/badge.svg)](https://github.com/juancruzdauberte/dreamhouse-back-office/actions/workflows/ci.yml)
  ```

---

### Phase C — Verification

- [ ] **T-12** Correr `npm run lint` — confirmar 0 errors (warnings OK).
- [ ] **T-13** Correr `npm run build` — confirmar que el build termina sin errores de TypeScript ni de Next.js.
- [ ] **T-14** Revisar `ci.yml` — confirmar que los 15 secrets coinciden exactamente con los nombres en el spec (sin typos).

---

## Acceptance Criteria

1. `npm run lint` retorna exit code 0 (0 errors; warnings no cuentan).
2. `npm run build` completa sin errores.
3. `.github/workflows/ci.yml` existe con los dos jobs (`lint`, `build`) y la estructura del design.
4. `README.md` tiene el badge CI en la segunda línea (debajo del heading).
5. Ningún archivo tiene `any` introducido como workaround — todos los fixes son tipados correctamente.

---

## Notes for apply

- Aplicar T-01 a T-09 primero (lint cleanup), luego T-10 y T-11 (workflow + badge).
- Después de T-09 y T-13, el repo queda listo para hacer push: el CI correrá automáticamente al primer push.
- Los GitHub Secrets son un paso manual en la UI del repo. Sin ellos el build job fallará. Documentar en el PR description.
