import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { IS_DEMO_MODE } from "@/lib/config";

const providers: NextAuthOptions["providers"] = [
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

      // Normalize email input (trim whitespace + lowercase)
      const normalizedEmail = credentials.email.trim().toLowerCase();

      const isDemoAccount =
        normalizedEmail === "admin@loop.ai" ||
        normalizedEmail === "analyst@loop.ai" ||
        normalizedEmail === "viewer@loop.ai";

      try {
        // 1. Check Database User with normalized email
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            memberships: {
              include: {
                workspace: true,
              },
            },
          },
        });

        if (user) {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          const isDemoPassword = isDemoAccount && credentials.password === "Password123!";

          if (isPasswordValid || isDemoPassword) {
            const primaryMembership = user.memberships[0];
            const userRole = primaryMembership?.role || (normalizedEmail.includes("analyst") ? "ANALYST" : normalizedEmail.includes("viewer") ? "VIEWER" : "ADMIN");

            return {
              id: user.id,
              name: user.name || normalizedEmail.split("@")[0],
              email: user.email,
              role: userRole,
              workspaceId: primaryMembership?.workspaceId || "ws_acme_prod_9921",
            };
          }
        }
      } catch (dbError: unknown) {
        console.warn("Database lookup fallback during auth:", dbError);
      }

      // 2. Demo Fallback (for demo accounts if DB is unseeded)
      if (IS_DEMO_MODE || isDemoAccount) {
        if (credentials.password === "Password123!" || isDemoAccount) {
          const role = normalizedEmail.includes("analyst")
            ? "ANALYST"
            : normalizedEmail.includes("viewer")
            ? "VIEWER"
            : "ADMIN";

          return {
            id: `demo-${role.toLowerCase()}-1`,
            name: role === "ADMIN" ? "Admin User" : role === "ANALYST" ? "Sarah Analyst" : "John Viewer",
            email: normalizedEmail,
            role,
            workspaceId: "ws_acme_prod_9921",
          };
        }
      }

      return null;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) return false;
        const normalizedEmail = user.email.trim().toLowerCase();

        try {
          const existingUser = await db.user.findUnique({
            where: { email: normalizedEmail },
            include: { memberships: true },
          });

          if (!existingUser) {
            const defaultPassword = await bcrypt.hash(`OAuth_${Math.random()}`, 12);
            const newUser = await db.user.create({
              data: {
                email: normalizedEmail,
                name: user.name || normalizedEmail.split("@")[0],
                image: user.image,
                password: defaultPassword,
                isVerified: true,
                emailVerified: new Date(),
              },
            });

            let primaryWorkspace = await db.workspace.findFirst();
            if (!primaryWorkspace) {
              primaryWorkspace = await db.workspace.create({
                data: {
                  name: `${user.name || "User"}'s Workspace`,
                  slug: `workspace-${Math.floor(1000 + Math.random() * 9000)}`,
                  apiKey: `loop_live_sk_${Math.random().toString(36).substring(2, 18)}`,
                },
              });
            }

            await db.workspaceMember.create({
              data: {
                workspaceId: primaryWorkspace.id,
                userId: newUser.id,
                role: "ADMIN",
              },
            });
          }
        } catch (error) {
          console.warn("OAuth user auto-provisioning fallback:", error);
        }
      }
      return true;
    },
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
