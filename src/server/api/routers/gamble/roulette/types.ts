export type Wheel = {
  gameId: string;
  createdAt: Date;
  players: string[];
} & (
  | {
      resultIndex: undefined;
      options: undefined;
      endedAt: undefined;
    }
  | {
      options: { option: string }[];
      resultIndex: number;
      endedAt: Date;
    }
);
