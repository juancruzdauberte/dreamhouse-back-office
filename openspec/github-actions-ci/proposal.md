# Proposal: github-actions-ci

## Change
**Name**: github-actions-ci  
**Type**: DevOps / Infrastructure  
**Scope**: Pequeño — 1 archivo nuevo + 1 modificado + corrección de lint en 6 archivos

---

## Intent

Configurar un pipeline de CI en GitHub Actions que ejecute `lint` y `build` automáticamente ante cada push y PR. Antes de activar el pipeline, limpiar los 8 errores de lint existentes para arrancar desde una base verde.

---

## Business Problem

No existe ningún gate de calidad automatizado. Errores de TypeScript, imports rotos o lint errors solo se detectan cuando el desarrollador corre `npm run build` o `npm run lint` manualmente. Esto significa que código con errores puede llegar a `main` sin que nadie lo note.

---

## Decisions (from user)

| Decisión | Valor elegido | Razón |
|----------|--------------|-------|
| Trigger | Push a toda rama + PR a `main` | Máxima cobertura |
| Lint failure | Warn only (`continue-on-error: true`) | No bloquear, solo visibilizar |
| Env vars en CI | GitHub Secrets reales | Evitar falsas victorias con dummies |
| Node version | 22 (coincide con local) | Paridad exacta con entorno de desarrollo |
| Badge en README | Sí | Señal visual inmediata del estado del repo |

---

## Pre-condition: lint baseline cleanup

El pipeline no puede arrancar con errores existentes. Los 8 errores son todos `no-explicit-any`:

| Archivo | Líneas con error |
|---------|-----------------|
| `app/api/event/route.ts` | 38, 90 |
| `app/api/inquiries/diag-airbnb/route.ts` | 27 |
| `app/api/test-calendar/route.ts` | 8 |
| `app/api/test-db/route.ts` | — (a confirmar en spec) |
| `app/lib/repository/booking/booking.repository.ts` | 21 |
| `app/lib/services/calendar.service.ts` | 124, 207, 246 |

**Fix**: reemplazar `any` por el tipo correcto o `unknown` con narrowing, según el contexto de cada archivo.

---

## Affected Files

### Nuevos
- `.github/workflows/ci.yml` — pipeline principal

### Modificados
- `README.md` — agregar badge de estado CI
- `app/api/event/route.ts` — fix lint
- `app/api/inquiries/diag-airbnb/route.ts` — fix lint
- `app/api/test-calendar/route.ts` — fix lint
- `app/api/test-db/route.ts` — fix lint (a confirmar)
- `app/lib/repository/booking/booking.repository.ts` — fix lint
- `app/lib/services/calendar.service.ts` — fix lint

---

## Pipeline Design

```yaml
# Trigger
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

# Jobs (secuencial: build no corre si lint falla)
jobs:
  lint:
    continue-on-error: true    # warn only, no bloquea
  build:
    needs: lint
    env: <secrets inyectados>  # GitHub Secrets reales
```

**Secrets necesarios** (a cargar en repo Settings → Secrets):
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
NEXTAUTH_SECRET, NEXTAUTH_URL
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID
IMAP_USER, IMAP_PASSWORD
ADMIN_EMAIL
```

---

## Non-Goals

- No deploya a producción (solo verifica)
- No corre tests (no hay test runner configurado)
- No Lighthouse / bundle size check (futuro)
- No notificaciones externas (Slack, email)

---

## Estimated Diff

| Actividad | Archivos | Líneas aprox. |
|-----------|----------|---------------|
| Crear `ci.yml` | 1 | ~60 |
| Fix lint errors | 6 | ~15 |
| Badge en README | 1 | ~3 |
| **Total** | **8** | **~78** |

Bien dentro del review budget de 400 líneas. **Single PR recomendado.**

---

## Risks

- `GOOGLE_PRIVATE_KEY` contiene `\n` literales — necesita manejo especial en GitHub Secrets (valor multilinea o escape).
- Si `next build` consume alguna var en build-time y no se inyecta, el job falla. A validar en spec con análisis de `next.config.ts`.
- Las rutas de diagnóstico (`/api/test-db`, `/api/test-calendar`) tienen `any` por ser código de prueba rápida — el fix puede ser `eslint-disable` justificado en lugar de tipado completo.
