import { toast } from "react-hot-toast";
import { type RouterInputs, api } from "./api";

type In = RouterInputs["consumable"];

export const useGetRemainingTea = (q: In["tea"]["getRemaining"]) =>
  api.consumable.tea.getRemaining.useQuery(q, {
    staleTime: 1000 * 60 * 5,
  });

export const useGetRemainingVoiceKick = (
  q: In["privilege"]["voiceKick"]["getRemaining"]
) =>
  api.consumable.privilege.voiceKick.getRemaining.useQuery(q, {
    staleTime: 1000 * 60 * 5,
  });

  
export const useGetRemainingVoiceMute = (
  q: In["privilege"]["voiceMute"]["getRemaining"]
) =>
  api.consumable.privilege.voiceMute.getRemaining.useQuery(q, {
    staleTime: 1000 * 60 * 5,
  });

export const useGetRemainingVoiceDeafen = (
  q: In["privilege"]["voiceDeafen"]["getRemaining"]
) =>
  api.consumable.privilege.voiceDeafen.getRemaining.useQuery(q, {
    staleTime: 1000 * 60 * 5,
  });


export const useConsumeTeaHistory = (q: In["tea"]["history"]) => {
  const utils = api.useContext();
  return api.consumable.tea.history.useQuery(q, {
    // on data change, invalidate getLeftTea
    structuralSharing(oldData, newData) {
      if (oldData === undefined) return newData;
      const r =
        oldData.length === newData.length &&
        oldData.every((oldItem, i) => oldItem.id === newData[i]?.id);
      if (!r) void utils.consumable.tea.getRemaining.invalidate();
      // invalidate instead of refetching; may be caused a trigger from consumeTea.mutation
      return newData;
    },
  });
};

export const useConsumeVoiceKick = () => {
  const utils = api.useContext();
  const id = "consumeVoiceKick";
  return api.consumable.privilege.voiceKick.consume.useMutation({
    onMutate: () => {
      toast.loading("Sesli atma hakkı kullanılıyor...", { id });
    },
    onSuccess: () => {
      toast.success("Sesli atma hakkı kullanıldı!", { id });
    },
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
    onSettled: () => {
      void utils.consumable.privilege.voiceKick.invalidate();
    },
  });
}

export const useConsumeVoiceMute = () => {
  const utils = api.useContext();
  const id = "consumeVoiceMute";
  return api.consumable.privilege.voiceMute.consume.useMutation({
    onMutate: () => {
      toast.loading("Sesli atma hakkı kullanılıyor...", { id });
    },
    onSuccess: () => {
      toast.success("Sesli atma hakkı kullanıldı!", { id });
    },
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
    onSettled: () => {
      void utils.consumable.privilege.voiceMute.invalidate();
    },
  });
}

export const useConsumeVoiceDeafen = () => {
  const utils = api.useContext();
  const id = "consumeVoiceDeafen";
  return api.consumable.privilege.voiceDeafen.consume.useMutation({
    onMutate: () => {
      toast.loading("Sesli atma hakkı kullanılıyor...", { id });
    },
    onSuccess: () => {
      toast.success("Sesli atma hakkı kullanıldı!", { id });
    },
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
    onSettled: () => {
      void utils.consumable.privilege.voiceDeafen.invalidate();
    },
  });
}

export const useConsumeTea = () => {
  const utils = api.useContext();
  const id = "consumeTea";
  return api.consumable.tea.consume.useMutation({
    onMutate: () => {
      toast.loading("Çay koyuluyor...", { id });
    },
    onSuccess: () => {
      toast.success("Çay koyuldu!", { id });
    },
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
    onSettled: () => {
      void utils.consumable.tea.getRemaining.invalidate();
      void utils.consumable.tea.history.invalidate();
    },
  });
};
