import { type NextPage } from "next";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import ResponsivePopup from "~/components/ResponsivePopup";
import { columns } from "~/components/memesComponents/columns";
import { DataTable } from "~/components/tables/generic-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { api } from "~/utils/api";
import { useInsertMeme } from "~/utils/useForum";

const Dictionary: NextPage = () => {
  const [Name, setName] = useState<string>("");
  const [Desc, setDesc] = useState<string>("");
  const memes = api.forum.memes.getMemes.useQuery().data ?? [];

  const insertMeme = useInsertMeme();

  return (
    <Layout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sözlük</CardTitle>
          <ResponsivePopup
            triggerButtonName="Yeni Kelime Ekle"
            headerTitle="Yeni Kelime"
            dialogFooter={
              <Button
                onClick={() => {
                  insertMeme.mutate({ name: Name, description: Desc });
                }}
                isLoading={insertMeme.isLoading}
                disabled={insertMeme.isLoading}
              >
                Onayla
              </Button>
            }
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <Input
                placeholder="Kelime"
                value={Name}
                onChange={(event) => setName(event.target.value)}
                disabled={insertMeme.isLoading}
              />
              <Input
                placeholder="Açıklama"
                value={Desc}
                onChange={(event) => setDesc(event.target.value)}
                disabled={insertMeme.isLoading}
              />
            </div>
          </ResponsivePopup>
        </CardHeader>
        <CardContent className="max-h-screen overflow-x-scroll font-semibold 2xl:overflow-x-hidden">
          <DataTable
            data={memes}
            columns={columns}
            pagination
            inputFilter={{ columnToFilter: "name", title: "Kelime" }}
          />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Dictionary;
