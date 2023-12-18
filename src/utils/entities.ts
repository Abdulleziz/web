import { z } from "zod";
import { DiscordId } from "./zod-utils";

const SystemEntityBase = z.object({
  id: z.number().positive().int().min(1),
  price: z.number().positive().int().min(1),
  image: z.string().url().optional(),
});

export const SystemEntity = z.discriminatedUnion("type", [
  SystemEntityBase.extend({
    type: z.literal("tea"),
    tea: z.object({
      name: z.string(),
      amountGram: z.number().positive().int(),
    }),
  }),
  SystemEntityBase.extend({
    type: z.literal("car"),
    car: z.object({
      brand: z.string(),
      model: z.string(),
      year: z.number().positive().int(),
    }),
  }),
  SystemEntityBase.extend({
    type: z.literal("phone"),
    phone: z.object({
      brand: z.string(),
      model: z.string(),
    }),
  }),
  SystemEntityBase.extend({
    type: z.literal("human"),
    human: z.object({
      discordId: DiscordId,
      name: z.string(),
      surname: z.string(),
    }),
  }),
]);
export type SystemEntity = z.infer<typeof SystemEntity>;
export type Tea = Extract<SystemEntity, { type: "tea" }>["tea"];
export type Car = Extract<SystemEntity, { type: "car" }>["car"];
export type Phone = Extract<SystemEntity, { type: "phone" }>["phone"];
export type Human = Extract<SystemEntity, { type: "human" }>["human"];

const SE = z.array(SystemEntity).transform((t) => {
  const ids = t.map((e) => e.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("SystemEntities array contains duplicate ids");

  return t;
});
type SE = z.infer<typeof SE>;

export const SystemEntitiesUrl =
  "https://github.com/Abdulleziz/web/tree/main/src/utils/entities.ts#L49";
export const SystemEntities = SE.parse([
  {
    id: 1,
    type: "tea",
    tea: {
      name: "Çaykur 2KG", // 1kg/5g == 200x
      amountGram: 2000,
    },
    price: 25,
    image:
      "https://cdn.cimri.io/market/260x260/caykur-2-kg-rize-turist-cayi-_1287528.jpg",
  },
  {
    id: 2,
    type: "tea",
    tea: {
      name: "Çaykur Demlik Poşet",
      amountGram: 200, // 200g/5g = 40x
    },
    price: 5,
    image:
      "https://images.migrosone.com/sanalmarket/product/03113301/caykur-demlik-poset-cay-40-li-200-gr-1c7b6a-1650x1650.jpg",
  },
  {
    id: 3,
    type: "car",
    car: {
      brand: "Renault",
      model: "Megan",
      year: 2005,
    },
    price: 9000,
    image:
      "https://www.auto-data.net/images/f32/Renault-Megane-II-Classic_1.jpg",
  },
  {
    id: 4,
    type: "car",
    car: {
      brand: "Renault",
      model: "Megan",
      year: 2021,
    },
    price: 10000,
    image:
      "https://www.log.com.tr/wp-content/uploads/2021/02/2021-renault-megane-3.jpg",
  },
  {
    id: 5,
    type: "phone",
    phone: {
      brand: "Apple",
      model: "iPhone 8 Plus",
    },
    price: 500,
    image:
      "https://images.hepsiburada.net/assets/Telefon/ProductDesc/iphone8plus-a%C3%A7%C4%B1klama-yeni.jpg",
  },
  {
    id: 6,
    type: "phone",
    phone: {
      brand: "Apple",
      model: "iPhone 12 Pro Max",
    },
    price: 1000,
    image:
      "https://productimages.hepsiburada.net/s/66/375-375/110000007422583.jpg",
  },
  {
    id: 7,
    type: "human",
    human: {
      discordId: "288397394465521664",
      name: "Barkin",
      surname: "Balci",
    },
    price: 9999,
    image:
      "https://uploadthing.com/f/5bf7445a-c410-4867-8e5e-43f0905a9d0a-n39zc3.jpg",
  },
] satisfies SE);

export function getSystemEntityById(id: number): SystemEntity {
  const entity = SystemEntities.find((e) => e.id === id);
  if (!entity) throw new Error("SystemEntity not found");
  return entity;
}
