import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiInternal as api } from "@/utils/routes";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${api}login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const res = await response.json();

          if (res.succeed) {
            if (![10, 40, 50].includes(res.payload.user.role)) {
              throw new Error("Нэвтрэх эрхгүй байна.");
            }

            return {
              email: res.payload.user.email,
              name:
                res.payload.user.firstname + " " + res.payload.user.lastname,
              accessToken: res.payload.accessToken,
              role: res.payload.user.role,
            };
          }

          throw new Error(res.message);
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 36 * 60 * 60,
    updateAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.accessToken = token.accessToken;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
