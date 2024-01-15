import { type NextApiRequest, type NextApiResponse } from "next";
import { ablyRest } from "~/server/ably";
import { getServerAuthSession } from "~/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerAuthSession({ req, res });
  const tokenRequestData = await ablyRest.auth.createTokenRequest({
    clientId: session?.user.id ?? "",
    capability: {
      "gamble-internal": ["stats"],
      "*": ["subscribe", "presence", "channel-metadata", "history"],
    },
  });
  res.status(200).json(tokenRequestData);
}
