import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@loop.ai" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: {
                workspace: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        const primaryMembership = user.memberships[0];

        return {
          id: user.id,
          name: user.name || user.email.split("@")[0],
          email: user.email,
          role: primaryMembership?.role || "ADMIN",
          workspaceId: primaryMembership?.workspaceId || "ws_acme_prod_9921",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "ADMIN";
        token.workspaceId = (user as { workspaceId?: string }).workspaceId || "ws_acme_prod_9921";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { workspaceId?: string }).workspaceId = token.workspaceId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_loop_ai",
};

