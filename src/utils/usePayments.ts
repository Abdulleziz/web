import { api } from "./api";

// kaç paran var
export const useGetWallet = () =>
  api.payments.getWallet.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 dk
  });
// { balance: number }

// tüm geçmiş! (herkesin)
export const usePaymentsHistory = () => api.payments.getAll.useQuery();
// Payment[] (salary, transfer, invoice(buy))

// satın al
export const useBuyEntities = () => {
  const utils = api.useContext();
  return api.payments.buyEntities.useMutation({
    // refresh wallet
    onSuccess: () => utils.payments.invalidate(),
  });
};
// mutate { entityId: number, amount: number }[]
// örn: [{ entityId: 1, amount: 1 }, { entityId: 2, amount: 2 }] -> 1x Çaykur 2kg + 2x Demlik poşet
// detaylar: ~/src/utils/entities.ts

// extradan maaş dağıt (özel eventlerde falan, yeni MEGAN sevinci 🤣😭)
// normalde maaşlar 12 saatte bir otomatik olarak dağıtılıyor (şimdilik)
export const useCreateSalary = () => api.payments.createSalary.useMutation();
// mutate { delay: number, multiplier: number }
// delay -> yarın, 2 saat sonra, 1 hafta sonra
// multiplier -> abdulleziz role severity * multiplier
// örn: CTO=90 multiplier=20 = 1800
