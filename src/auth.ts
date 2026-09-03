import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getUserByEmail, upsertGoogleUser } from "@/lib/convex-store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          await upsertGoogleUser({
            email: user.email,
            googleId: account.providerAccountId,
            avatar: user.image ?? undefined,
            name: user.name ?? user.email,
          });
          return true;
        } catch (err) {
          console.error("[auth] signIn DB error:", err);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, trigger }) {
      if (trigger === "signIn" || trigger === "update" || !token.userId) {
        if (token.email) {
          const dbUser = await getUserByEmail(token.email);
          if (dbUser) {
            token.userId = dbUser.id;
            token.onboarded = dbUser.onboarded;
            token.avatar = dbUser.avatar;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.onboarded = token.onboarded as boolean;
        if (token.avatar) session.user.image = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
