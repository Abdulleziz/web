import classNames from "classnames";
import Image from "next/image";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { useGetProfile } from "~/utils/useProfile";
import { type UserId, abdullezizRoleSeverities } from "~/utils/zod-utils";

type ProfileProps = { profileId: UserId };

const gradient = classNames(
  "font-extrabold text-transparent text-xl md:text-4xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
);

export const Profile = ({ profileId }: ProfileProps) => {
  const { data: user, isLoading } = useGetProfile(profileId);
  if (isLoading || !user)
    // TODO: skeleton
    return <button className="loading btn">Yükleniyor</button>;

  const userImage = user.image;
  const memberImage =
    !!user.member.avatar &&
    getAvatarUrl(
      { avatar: user.image, id: user.discordId },
      user.member.avatar
    );

  const topRole = user.member.roles[0];

  const style = topRole
    ? {
        color: `#${topRole.color.toString(16)}`,
      }
    : { color: "white" };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center pb-32">
      <div className="flex w-full flex-1 flex-col items-center gap-4 text-center">
        <div>
          <p className="text-3xl font-extrabold text-primary">{user.name}</p>
          {topRole && (
            <p style={style} className="font-mono text-3xl font-bold">
              ({topRole.name})
            </p>
          )}
        </div>
        <div className="flex flex-row items-center justify-center gap-2">
          {memberImage && (
            <Image
              alt="Member Image"
              src={memberImage}
              className="w-32 rounded-full"
              width={128}
              height={128}
            />
          )}
          {userImage && (
            <Image
              alt="User Image"
              src={userImage}
              className="w-32 rounded-full"
              width={128}
              height={128}
            />
          )}
        </div>
        {/* STATS */}
        <div
          className={
            "flex flex-col items-center justify-center gap-4 font-mono " +
            gradient
          }
        >
          <p>Forum Thread sayısı: {user._count.forumThreads}</p>
          <p>Forum Post sayısı: {user._count.forumPosts}</p>
          <p>Dinlediği hatırlatıcı sayısı: {user._count.listenedCrons}</p>
          <p>Maaş/Transfer alma sayısı: {user._count.paymentsRecieved}</p>
          <p>Maaş/Transfer gönderme sayısı: {user._count.paymentsSent}</p>
          <p>İçtiği çay sayısı: {user._count.teaConsumer}</p>
          {topRole && (
            <p>Tahmini maaş: {abdullezizRoleSeverities[topRole.name] * 10}$</p>
          )}
          <div>
            <p>Permler: </p>
            <p className="max-w-xs text-xs text-accent md:text-xl">
              {user.member.perms.join(", ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
