import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { REST } from "@discordjs/rest";
import * as v10 from "discord-api-types/v10";
import { getAvatarUrl } from "./discord-api/utils";
import { inAbdullezizServerOrThrow } from "./discord-api/trpc";

type User = v10.RESTGetAPICurrentUserResult;

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      discordId: string;
      inAbdullezizServer: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        [session.user.discordId, session.user.inAbdullezizServer] =
          await inAbdullezizServerOrThrow({ databaseUserId: user.id });
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
    },
    async signIn({ user: { id, email }, account }) {
      // NOTE: id is providerAccountId

      if (account?.provider !== "discord") {
        if (!email) return false;
        await inAbdullezizServerOrThrow({ userEmail: email }); // ensures discord account is linked
        return true;
      }

      const access_token = account.access_token;
      if (!access_token) return true;

      const discord = new REST({
        version: "10",
        authPrefix: "Bearer",
      }).setToken(access_token);

      try {
        // update user image
        const user = (await discord.get(v10.Routes.user())) as User;
        const image = getAvatarUrl(user);
        const to_update = await prisma.user.findUnique({
          where: { id },
          select: { image: true },
        });
        if (to_update && to_update.image !== image)
          await prisma.user.update({ where: { id }, data: { image } });
      } catch (e) {
        console.error("Unable to update user image");
        console.error(e);
      }
      return true;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
