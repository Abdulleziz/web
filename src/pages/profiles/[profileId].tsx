import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout } from "~/components/Layout";
import { UserId } from "~/utils/zod-utils";
import { Profile } from "~/components/Profile";

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const parseProfileId = UserId.safeParse(router.query.profileId);

  if (!parseProfileId.success) {
    return (
      <Layout>
        {/* TODO: custom 404page */}
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>Gerçek bir Profil id gibi durmuyor!</p>
          <div
            className="btn btn-primary"
            onClick={() => void router.push("/")}
          >
            Geri Dön
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Profile - Abdulleziz Corp.">
      <Profile profileId={parseProfileId.data} />
    </Layout>
  );
};

export default ProfilePage;
