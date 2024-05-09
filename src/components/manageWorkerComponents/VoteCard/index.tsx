import {
  type AbdullezizRole,
  PROMOTE,
  DEMOTE,
  abdullezizRoles,
  abdullezizRoleSeverities,
  abdullezizUnvotableRoles,
  type AbdullezizUnvotableRole,
} from "~/utils/zod-utils";
import { useVote, useVoteCEO, type User, useAssign } from "~/utils/useDiscord";
import { formatName } from "~/utils/abdulleziz";
import { Card, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  useConsumeVoiceDeafen,
  useConsumeVoiceKick,
  useConsumeVoiceMute,
  useGetRemainingVoiceDeafen,
  useGetRemainingVoiceKick,
  useGetRemainingVoiceMute,
} from "~/utils/useConsumable";
import Link from "next/link";
import { MicOffIcon, UnplugIcon, VolumeXIcon } from "lucide-react";

const FormSchema = z.object({
  role: z.string({
    required_error: "Bir rol Seçin",
  }),
});

export const ManageWorker: React.FC<{
  worker: User;
}> = ({ worker }) => {
  const vote = useVote();
  const voteCEO = useVoteCEO();
  const assign = useAssign();
  const voiceKick = useGetRemainingVoiceKick();
  const voiceMute = useGetRemainingVoiceMute();
  const voiceDeafen = useGetRemainingVoiceDeafen();

  const kick = useConsumeVoiceKick();
  const mute = useConsumeVoiceMute();
  const deafen = useConsumeVoiceDeafen();

  const roles = Object.keys(abdullezizRoles) as AbdullezizRole[];

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = ({ role }: z.infer<typeof FormSchema>) => {
    const user = worker.user.id;
    const onlyAssign = abdullezizUnvotableRoles.includes(
      role as AbdullezizUnvotableRole
    );

    if (role === "CEO") voteCEO.mutate(user);
    else if (onlyAssign) assign.mutate({ role, user });
    else vote.mutate({ role, user });
  };

  return (
    <Card className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {worker?.roles[0]?.name !== "CEO" ? (
        <Card className="m-2 flex flex-col gap-2 rounded-lg p-4 shadow lg:gap-4 lg:p-8">
          <CardTitle>Oylama Başlat!</CardTitle>

          <Dialog>
            <Form {...form}>
              <form
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-2/3 space-y-6"
              >
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field, formState: { isValid } }) => (
                    <>
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bir rol seç" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => {
                              const userRole = worker?.roles[0]?.name;
                              const severity = abdullezizRoleSeverities[role];
                              const quit = userRole === role;
                              // prettier-ignore
                              const userSeverity = userRole ? abdullezizRoleSeverities[userRole] : 1;
                              const promote = severity >= userSeverity && !quit;
                              const required = promote
                                ? PROMOTE * severity
                                : DEMOTE * userSeverity;
                              return (
                                <SelectItem key={role} value={role}>
                                  {`${role} - ${required} pts`}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Oylama başlatmak için bir rol seçin.
                        </FormDescription>
                        <FormMessage />

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Emin Misin?</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>
                            Lütfen İşlemin detaylarını kontrol et.
                          </DialogDescription>
                          <div className="flex flex-col gap-3">
                            <div>
                              <Label htmlFor="user">Kullanıcı</Label>
                              <h1 id="user">
                                {worker ? formatName(worker) : "Worker"}
                              </h1>
                            </div>
                            <div>
                              <Label htmlFor="beforeRole">Eski Rol</Label>
                              <h1 id="beforeRole">{worker?.roles[0]?.name}</h1>
                            </div>
                            <div>
                              <Label htmlFor="afterRole">Yeni Rol</Label>
                              <h1 id="afterRole">{field.value}</h1>
                            </div>
                            <DialogClose asChild>
                              <Button
                                type="submit"
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onClick={form.handleSubmit(onSubmit)}
                              >
                                Onayla
                              </Button>
                            </DialogClose>
                          </div>
                        </DialogContent>
                      </FormItem>
                      <DialogTrigger asChild>
                        <Button disabled={!isValid} type="button">
                          Onayla
                        </Button>
                      </DialogTrigger>
                    </>
                  )}
                />
              </form>
            </Form>
          </Dialog>
        </Card>
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-lg p-8 shadow">
          <p className="text-2xl">{"CEO'yu"} yönetemezsin</p>
        </div>
      )}
      <Card className="m-2 flex flex-col gap-2 rounded-lg p-4 shadow lg:gap-4 lg:p-8">
        <CardTitle>Sesi Yönet</CardTitle>
        <div className="flex items-center justify-start gap-2">
          {!voiceKick.data && (
            <Link href={"/store"}>
              <Button size={"relative-sm"}>Satın Al</Button>
            </Link>
          )}
        </div>
        <p className="text-warning">
          Uyarı: Bu işlem geri alınamaz, eğer kullanıcı seste değil ise hakkınız
          çöpe gidecektir.
        </p>
        <div className="flex w-full gap-2">
          <Button
            size={"icon"}
            variant={"bj_hit"}
            className="w-full"
            isLoading={voiceMute.isLoading || mute.isLoading}
            disabled={
              voiceMute.isLoading || mute.isLoading || voiceMute.data === 0
            }
            onClick={() =>
              mute.mutate({ target: worker.user.id, mode: "toggle" })
            }
          >
            <div className="flex gap-1">
              <MicOffIcon /> {voiceMute.data}
            </div>
          </Button>
          <Button
            size={"icon"}
            className="w-full"
            isLoading={voiceDeafen.isLoading || deafen.isLoading}
            variant={"bj_split"}
            disabled={
              voiceDeafen.isLoading ||
              deafen.isLoading ||
              voiceDeafen.data === 0
            }
            onClick={() =>
              deafen.mutate({ target: worker.user.id, mode: "toggle" })
            }
          >
            <div className="flex gap-1">
              <VolumeXIcon /> {voiceDeafen.data}
            </div>
          </Button>
          <Button
            size={"icon"}
            isLoading={voiceKick.isLoading || kick.isLoading}
            disabled={
              voiceKick.isLoading || kick.isLoading || voiceKick.data === 0
            }
            variant={"bj_stand"}
            onClick={() => kick.mutate(worker.user.id)}
            className="w-full"
          >
            <div className="flex gap-1">
              <UnplugIcon /> {voiceKick.data}
            </div>
          </Button>
        </div>
      </Card>
    </Card>
  );
};
