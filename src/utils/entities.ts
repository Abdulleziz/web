import { z } from "zod";
import { DiscordId } from "./zod-utils";
import { TransferMoney } from "./shared";

const SystemEntityBase = z.object({
  id: z.number().positive().int(),
  price: z.union([
    TransferMoney,
    z.array(z.object({ until: z.date(), value: TransferMoney })).min(1),
  ]),
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
  SystemEntityBase.extend({
    type: z.literal("privilege"),
    privilege: z.object({
      kind: z.enum(["voice-kick", "voice-mute", "voice-deafen"]),
      name: z.string(),
      description: z.string(),
    }),
  }),
]);
export type SystemEntityInput = z.infer<typeof SystemEntity>;
export type SystemEntity = z.output<typeof SE>[number];
export type Tea = Extract<SystemEntity, { type: "tea" }>["tea"];
export type Car = Extract<SystemEntity, { type: "car" }>["car"];
export type Phone = Extract<SystemEntity, { type: "phone" }>["phone"];
export type Human = Extract<SystemEntity, { type: "human" }>["human"];
export type Privilege = Extract<
  SystemEntity,
  { type: "privilege" }
>["privilege"];

const SE = z.array(SystemEntity).transform((t) => {
  const ids = t.map((e) => e.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("SystemEntities array contains duplicate ids");

  return t.map((entity) => {
    const price =
      typeof entity.price === "number"
        ? entity.price
        : entity.price
            .filter((p) => p.until <= new Date()) // ignore future prices
            .sort((a, b) => b.until.getTime() - a.until.getTime())[0]?.value; // get latest price

    if (!price) throw new Error("SystemEntity price not found");
    return { ...entity, price };
  });
});
type SE = z.infer<typeof SE>;

const start = new Date("2021");

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
    price: [
      { until: start, value: 9999 },
      { until: new Date("2023-12-22"), value: 1 },
      { until: new Date("2023-12-23"), value: 9999 },
    ],
    image:
      "https://uploadthing.com/f/5bf7445a-c410-4867-8e5e-43f0905a9d0a-n39zc3.jpg",
  },
  {
    id: 8,
    type: "privilege",
    privilege: {
      kind: "voice-kick",
      name: "Voice Kick",
      description: "Kick someone from voice channel",
    },
    price: 200,
    image: "https://utfs.io/f/6ecd0943-59e7-46bd-8704-9f64f3028a3a-8rsfj0.png",
  },
  {
    id: 9,
    type: "privilege",
    privilege: {
      kind: "voice-mute",
      name: "Voice Mute",
      description: "Mute someone in voice channel",
    },
    price: 100,
    image: "https://utfs.io/f/da3cf083-da4f-447c-9c2e-f8693c484a25-2036h.png",
  },
  {
    id: 10,
    type: "privilege",
    privilege: {
      kind: "voice-deafen",
      name: "Voice Defaen",
      description: "Deafen someone in voice channel",
    },
    price: 150,
    image: "https://utfs.io/f/689fd03d-3e35-49e2-abff-23589525ec68-m3air5.png",
  },
] satisfies SystemEntityInput[]);

export function getSystemEntityById(id: number): SystemEntity {
  const entity = SystemEntities.find((e) => e.id === id);
  if (!entity) throw new Error("SystemEntity not found");
  return entity;
}
