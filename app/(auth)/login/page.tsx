"use client";

import { useSession, signIn } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";

function SignInContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);

    try {
      await signIn("google", { callbackUrl, redirect: true });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setAuthError(
        "No se pudo iniciar sesión. Verifica tu cuenta de Google e inténtalo de nuevo.",
      );
      setIsSigningIn(false);
    }
  };

  if (session?.user?.email) {
    redirect(callbackUrl);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute -left-24 top-14 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-foreground/8 blur-3xl" />

      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-10">
          <div className="text-center">
            <div className="mb-4 inline-flex h-28 w-28 items-center justify-center rounded-full border border-border/80 bg-background">
              <Image
                src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1764695249/image_arimsd.png"
                alt="Logo de Dream House"
                width={80}
                height={80}
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground text-balance sm:text-4xl">
              Bienvenido
            </h1>
            <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
              Inicia sesión para administrar reservas, clientes y operaciones de
              forma segura.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleSignIn}
              type="button"
              disabled={isSigningIn}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-border bg-background px-6 py-4 font-semibold text-foreground shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {isSigningIn ? (
                <>
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/50 border-t-transparent motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span className="text-base">Iniciando sesión…</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-base">Continuar con Google</span>
                </>
              )}
            </button>

            {authError ? (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {authError}
              </p>
            ) : null}

            <p className="sr-only" aria-live="polite">
              {isSigningIn ? "Iniciando sesión…" : ""}
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-muted-foreground">
                  Inicio de sesión seguro
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Solo personal autorizado puede acceder al panel.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none"
            aria-label="Cargando inicio de sesión"
          />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
