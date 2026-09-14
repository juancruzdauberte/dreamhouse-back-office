# Design: github-actions-ci

## Change
**Name**: github-actions-ci
**Inputs**: openspec/github-actions-ci/proposal.md, openspec/github-actions-ci/spec.md

---

## Architecture Decisions

| Decisión | Elección | Razón |
|----------|----------|-------|
| Runner | `ubuntu-latest` | Estándar, compatible con Node 22, sin costo extra |
| Node setup | `actions/setup-node@v4` con `cache: 'npm'` | Cache integrado de `~/.npm` por hash de `package-lock.json` |
| Install | `npm ci` | Reproducible, usa el lockfile exacto |
| Lint failure behavior | `continue-on-error: true` a nivel de **job** | El job se marca failed pero no cancela el build |
| Job ordering | `needs: lint` en build | Build espera que lint termine (success o failure) antes de correr |
| Secrets scope | `env:` a nivel de **job** en build | Secrets solo disponibles donde se necesitan; lint no los necesita |
| `any` fix strategy | `catch (error: unknown)` + narrowing | ES idiomático en TS strict; evita `eslint-disable` innecesario |
| `pool.execute` type | `ResultSetHeader` (mysql2) | Tipo correcto para INSERT — expone `.insertId` y `.affectedRows` |
| GaxiosError narrowing | Inline cast `as { code?: number; response?: { status?: number }; message?: string }` | No requiere importar `gaxios` directamente; es suficiente para el acceso existente |

---

## File: `.github/workflows/ci.yml` (nuevo)

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint
    env:
      DB_HOST: ${{ secrets.DB_HOST }}
      DB_PORT: ${{ secrets.DB_PORT }}
      DB_USER: ${{ secrets.DB_USER }}
      DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      DB_DATABASE: ${{ secrets.DB_DATABASE }}
      NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
      GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
      GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
      GOOGLE_CLIENT_EMAIL: ${{ secrets.GOOGLE_CLIENT_EMAIL }}
      GOOGLE_PRIVATE_KEY: ${{ secrets.GOOGLE_PRIVATE_KEY }}
      GOOGLE_CALENDAR_ID: ${{ secrets.GOOGLE_CALENDAR_ID }}
      IMAP_USER: ${{ secrets.IMAP_USER }}
      IMAP_PASSWORD: ${{ secrets.IMAP_PASSWORD }}
      ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

---

## Lint Fixes — Code-Level Design

### Fix E1 — `app/api/event/route.ts:38`

```ts
// Before
} catch (error: any) {
  console.error("Error creando evento:", error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Error creando evento:", error);
  return NextResponse.json({ error: message }, { status: 500 });
}
```

---

### Fix E2 — `app/api/inquiries/diag-airbnb/route.ts:90`

Add an inline type before the `results` array declaration, then remove the `any` in the filter:

```ts
// Before
const results: object[] = [];
// ...
rtbCount: results.filter((r: any) => r.isRTB).length,

// After
type DiagResult = {
  uid: number;
  subject: string;
  isRTB: boolean;
  [key: string]: unknown;
};
const results: DiagResult[] = [];
// ...
rtbCount: results.filter((r) => r.isRTB).length,
```

---

### Fix E3 — `app/api/test-calendar/route.ts:27`

```ts
// Before
} catch (error: any) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  );
}

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  return NextResponse.json({ error: message, stack }, { status: 500 });
}
```

---

### Fix E4 — `app/api/test-db/route.ts:8`

```ts
// Before
} catch (error: any) {
  console.error("Database connection error:", error);
  return NextResponse.json(
    { status: "Error", message: error.message },
    { status: 500 }
  );
}

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Database connection error:", error);
  return NextResponse.json({ status: "Error", message }, { status: 500 });
}
```

---

### Fix E5 — `app/lib/repository/booking/booking.repository.ts:21`

```ts
// Add import at top of file (alongside existing mysql2 imports)
import type { ResultSetHeader } from "mysql2";

// Before
const [result] = await pool.execute<any>(
  "INSERT INTO fact_reservas ...",
  [...],
);

// After
const [result] = await pool.execute<ResultSetHeader>(
  "INSERT INTO fact_reservas ...",
  [...],
);
```

> `ResultSetHeader` is the correct mysql2 type for INSERT/UPDATE/DELETE.
> It exposes `.insertId` and `.affectedRows`. The existing `result.insertId` usage
> continues to work — now with proper typing.

---

### Fix E6 — `app/lib/services/calendar.service.ts:124` (createGoogleCalendarEvent)

This catch block also accesses `error.code` and `error.response?.status` (GaxiosError shape).
Use an inline cast to cover both `.message` and the Google-specific fields:

```ts
// Before
} catch (error: any) {
  console.error("Error creando evento en Google Calendar:", error);
  if (error.code === 404 || error.response?.status === 404) { ... }
  throw new Error(error.message || "Error creando evento");
}

// After
} catch (error: unknown) {
  console.error("Error creando evento en Google Calendar:", error);
  const err = error as {
    code?: number;
    response?: { status?: number };
    message?: string;
  };
  if (err.code === 404 || err.response?.status === 404) {
    try {
      const cal = google.calendar({ version: "v3", auth: createAuth() });
      const list = await cal.calendarList.list();
      console.log(
        "DEBUG calendarios accesibles:",
        list.data.items?.map((c) => c.id),
      );
    } catch (listError) {
      console.error("Error listando calendarios:", listError);
    }
  }
  throw new Error(err.message ?? "Error creando evento");
}
```

---

### Fix E7 — `app/lib/services/calendar.service.ts:207` (updateGoogleCalendarEvent)

```ts
// Before
} catch (error: any) {
  console.error("Error actualizando evento en Google Calendar:", error);
  return { success: false, message: error.message };
}

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Error actualizando evento en Google Calendar:", error);
  return { success: false, message };
}
```

---

### Fix E8 — `app/lib/services/calendar.service.ts:246` (deleteGoogleCalendarEvent)

```ts
// Before
} catch (error: any) {
  console.error("Error eliminando evento en Google Calendar:", error);
  return { success: false, message: error.message };
}

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Error eliminando evento en Google Calendar:", error);
  return { success: false, message };
}
```

---

## File: `README.md` — Badge (modificar línea 1)

Insert after the `# 🏡 Dreamhouse Back-Office` heading:

```markdown
[![CI](https://github.com/juancruzdauberte/dreamhouse-back-office/actions/workflows/ci.yml/badge.svg)](https://github.com/juancruzdauberte/dreamhouse-back-office/actions/workflows/ci.yml)
```

---

## GitHub Secrets Setup (manual — fuera del diff)

Navigation: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Where to get it |
|--------|----------------|
| `DB_HOST` | Railway dashboard → MySQL service → Connection |
| `DB_PORT` | Railway dashboard (usually `3306`) |
| `DB_USER` | Railway dashboard |
| `DB_PASSWORD` | Railway dashboard |
| `DB_DATABASE` | Railway dashboard |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de producción (ej: `https://dreamhouse.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 |
| `GOOGLE_CLIENT_EMAIL` | Google Cloud Console → Service Account |
| `GOOGLE_PRIVATE_KEY` | **Copiar como string de una línea** con `\n` literales (el archivo .env ya lo tiene así) |
| `GOOGLE_CALENDAR_ID` | Google Calendar → Settings → Calendar ID |
| `IMAP_USER` | Dirección Gmail |
| `IMAP_PASSWORD` | Gmail App Password (no la contraseña de cuenta) |
| `ADMIN_EMAIL` | Email del admin |

### GOOGLE_PRIVATE_KEY — instrucción exacta

El `.env` local ya tiene el formato correcto: `"-----BEGIN RSA PRIVATE KEY-----\nMIIE..."`.
Copiar el valor **incluyendo las comillas externas no**, solo el contenido.
El valor en GitHub Secrets debe verse así en una sola línea:
```
-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n
```
El código en `test-calendar/route.ts` y en `calendar.service.ts` ya llama `.replace(/\\n/g, "\n")`
por lo que no requiere transformación adicional.

---

## Estimated diff

| Actividad | Archivos | Líneas cambiadas |
|-----------|----------|-----------------|
| Crear `ci.yml` | 1 | +62 |
| Fix lint E1–E8 | 6 | ~+16 / -8 |
| Badge en README | 1 | +1 |
| **Total** | **8** | **~71** |

Dentro del review budget de 400 líneas. ✅ Single PR.
