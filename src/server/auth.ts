import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { getGuildMembers } from "./discord-api/guild";
import { REST } from "@discordjs/rest";
import {
  type RESTGetAPICurrentUserResult,
  Routes,
} from "discord-api-types/v10";
import { getAvatarUrl } from "./discord-api/utils";

type User = RESTGetAPICurrentUserResult;

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
        const account = await prisma.account.findFirstOrThrow({
          where: { userId: user.id },
          select: { providerAccountId: true },
        });

        const abdullezizMembers = await getGuildMembers();

        session.user.id = user.id;
        session.user.discordId = account.providerAccountId;
        session.user.inAbdullezizServer = !!abdullezizMembers?.find(
          (member) => member.user.id === session.user.discordId
        );
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
    },
    async signIn({ user: { id }, account }) {
      const access_token = account?.access_token;
      if (!access_token) return false;

      const discord = new REST({
        version: "10",
        authPrefix: "Bearer",
      }).setToken(access_token);

      // update user image
      const user = (await discord.get(Routes.user())) as User;
      const image = getAvatarUrl(user);
      await prisma.user.update({ where: { id }, data: { image } });
      return true;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    /**
     * @see https://next-auth.js.org/providers/github
     */
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
