import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const USER = process.env.ADMIN_EMAIL;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      try {
        if (!USER) {
          return "/auth/error?error=ConfigurationError";
        }

        if (user.email !== USER) {
          return "/error-login";
        }

        return true;
      } catch (error) {
        console.error("Error al verificar usuario en BD:", error);
        return "/auth/error?error=DatabaseError";
      }
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        try {
          if (USER) {
            token.email = USER;
          } else {
            // Caso de seguridad adicional
            console.error("Usuario pasó signIn pero no existe en JWT callback");
            token.error = "UserNotFound";
          }
        } catch (error) {
          console.error("Error al buscar usuario en JWT callback:", error);
          token.error = "DatabaseError";
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Solo crear sesión válida si no hay errores
      if (token && session.user && !token.error) {
        session.user.email = token.email as string;
      } else if (token.error) {
        // Si hay un error en el token, invalidar la sesión
        session.user = {
          email: null,
        };
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/errorLogin",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },

  events: {
    // Evento que se dispara cuando hay un error de sign in
    async signIn({ user, account, isNewUser }) {
      console.log("Sign in exitoso:", {
        email: user.email,
        isNewUser,
        provider: account?.provider,
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
