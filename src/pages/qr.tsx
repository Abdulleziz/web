import { type NextPage } from "next";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { useHydrated } from "./_app";
import { Button } from "~/components/ui/button";
import { QrScanner } from "@yudiel/react-qr-scanner";
import Link from "next/link";

const Test: NextPage = () => {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useHydrated();

  return (
    <Layout>
      {hydrated && (
        <div className="w-s flex w-full items-center justify-center">
          <div className="w-1/2">
            <QrScanner
              onResult={(result) => setData(result.getText())}
              onError={(err) => setError(err.message)}
            />
          </div>
        </div>
      )}

      <p>Data: {data}</p>
      <p>Error: {error}</p>
      {data && (
        <Link
          href={`https://yoklama.abdulleziz.com/?qrLink=${encodeURI(data)}`}
        >
          <Button variant={"link"}>Visit Attendance Site</Button>
        </Link>
      )}
    </Layout>
  );
};

export default Test;
