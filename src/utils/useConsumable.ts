import { toast } from "react-hot-toast";
import { type RouterInputs, api } from "./api";

type In = RouterInputs["consumable"];

export const useGetRemainingTea = (q: In["tea"]["getRemaining"]) =>
  api.consumable.tea.getRemaining.useQuery(q, {
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
