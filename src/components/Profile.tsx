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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          role="status"
          className="flex scale-150 items-center justify-center"
        >
          <svg
            aria-hidden="true"
            className="mr-2 inline h-8 w-8 animate-spin fill-accent text-base-100 dark:text-gray-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="animate-pulse">Loading...</span>
        </div>
      </div>
    );

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
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="rounded bg-base-100 p-10">
        <div className="flex items-center ">
          <div className="mr-20">
            <h3 className="text-4xl font-extrabold">{user.name}</h3>
            <h4 className="text-xl font-bold">{user.member.nick}</h4>
          </div>
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
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="flex flex-row items-center rounded bg-base-300 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 96 960 960"
              width="36"
              className="fill-accent"
            >
              <path d="M200 936V256h343l19 86h238v370H544l-18.933-85H260v309h-60Zm300-452Zm95 168h145V402H511l-19-86H260v251h316l19 85Z" />
            </svg>
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.forumThreads}
              </span>
              <span>Forum Thread</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded bg-base-300 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 96 960 960"
              width="36"
              className="fill-accent"
            >
              <path d="M80 776V218q0-14 13-28t27-14h519q15 0 28 13.5t13 28.5v356q0 14-13 28t-28 14H240L80 776Zm201 40q-14 0-27.5-14T240 774v-98h500V336h100q14 0 27 14t13 29v596L721 816H281Zm339-580H140v395l75-75h405V236Zm-480 0v395-395Z" />
            </svg>
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.forumPosts}
              </span>
              <span>Forum Post</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded bg-base-300 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 96 960 960"
              width="36"
              className="fill-accent"
            >
              <path d="M124 489q0-81 34-153.5T255 212l41 45q-53 43-82.5 103.5T184 489h-60Zm653 0q0-68-28-128.5T668 257l41-45q62 52 95 124t33 153h-60ZM160 856v-60h84V490q0-84 49.5-149.5T424 258v-29q0-23 16.5-38t39.5-15q23 0 39.5 15t16.5 38v29q81 17 131 82.5T717 490v306h83v60H160Zm320-295Zm0 415q-32 0-56-23.5T400 896h160q0 33-23.5 56.5T480 976ZM304 796h353V490q0-74-51-126t-125-52q-74 0-125.5 52T304 490v306Z" />
            </svg>
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.listenedCrons}
              </span>
              <span>Aktif Dinlenen hatırlatıcılar</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded bg-base-300 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 96 960 960"
              width="36"
              className="fill-accent"
            >
              <path d="M540 636q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM220 776q-24.75 0-42.375-17.625T160 716V316q0-24.75 17.625-42.375T220 256h640q24.75 0 42.375 17.625T920 316v400q0 24.75-17.625 42.375T860 776H220Zm100-60h440q0-42 29-71t71-29V416q-42 0-71-29t-29-71H320q0 42-29 71t-71 29v200q42 0 71 29t29 71Zm480 180H100q-24.75 0-42.375-17.625T40 836V376h60v460h700v60ZM220 716V316v400Z" />
            </svg>
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.paymentsRecieved}
              </span>
              <span>Maaş/Transfer Alma</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded bg-base-300 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 96 960 960"
              width="36"
              className="fill-accent"
            >
              <path d="M451 863h55v-52q61-7 95-37.5t34-81.5q0-51-29-83t-98-61q-58-24-84-43t-26-51q0-31 22.5-49t61.5-18q30 0 52 14t37 42l48-23q-17-35-45-55t-66-24v-51h-55v51q-51 7-80.5 37.5T343 454q0 49 30 78t90 54q67 28 92 50.5t25 55.5q0 32-26.5 51.5T487 763q-39 0-69.5-22T375 681l-51 17q21 46 51.5 72.5T451 809v54Zm29 113q-82 0-155-31.5t-127.5-86Q143 804 111.5 731T80 576q0-83 31.5-156t86-127Q252 239 325 207.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 82-31.5 155T763 858.5q-54 54.5-127 86T480 976Zm0-60q142 0 241-99.5T820 576q0-142-99-241t-241-99q-141 0-240.5 99T140 576q0 141 99.5 240.5T480 916Zm0-340Z" />
            </svg>
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.paymentsSent}
              </span>
              <span>Maaş/Transfer Gönderme</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded bg-base-300 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="36"
              viewBox="0 96 960 960"
              width="36"
              className="fill-accent"
            >
              <path d="M444 446q-60 0-119 19.5T218 520l44 396h436l47-430h-48q-37.247 0-68.124-5.5Q598 475 544 460q-25-7-49.5-10.5T444 446Zm-233 7q51-32 111.5-49T444 386q30 0 59.5 4t56.5 12q51.128 14 78.226 19 27.097 5 57.774 5h56l21-190H187l24 217Zm51 523q-23.25 0-40.5-14.93Q204.25 946.141 202 923l-82-747h720l-82 747q-2.25 23.141-19.5 38.07Q721.25 976 698 976H262Zm182-60h253-435 182Z" />
            </svg>
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.teaConsumer}
              </span>
              <span>içilen çay sayısı</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
