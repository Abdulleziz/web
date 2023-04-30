import type { NextApiRequest, NextApiResponse } from "next";
import { getBaseUrl } from "~/utils/api";

// next-api endpoint: /api/test
// eslint-disable-next-line @typescript-eslint/require-await
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res
    .status(200)
    .json({
      base: getBaseUrl(),
      next_auth: process.env.NEXTAUTH_URL,
      vercel: process.env.VERCEL_URL,
    });
}
