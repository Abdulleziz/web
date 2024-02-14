/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type Types } from "ably";
import { useChannel, usePresence } from "ably/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import superjson from "superjson";
import {} from "~/server/api/routers/gamble/blackjack/api";
import { type Events } from "~/server/api/routers/gamble/blackjack/types";
import { api } from "~/utils/api";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

const CHANNEL = "gamble:blackjack";

// optimistic updates, toasts and logs
export function useBlackJackGame() {
  const session = useSession();
  const users = useGetAbdullezizUsers();
  const utils = api.useContext();

  const [bet, setBet] = useState(0);
  const [logs, setLogs] = useState<Array<Types.Message>>([]);
  const [liveLogs, setLiveLogs] = useState<Array<Types.Message>>([]);
  const [presence, setPresence] = useState<Array<Types.PresenceMessage>>([]);

  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  function getEventData<TKey extends keyof Events>(
    name: TKey,
    data: unknown
  ): [TKey, Events[TKey]] {
    return [name, superjson.parse<Events[TKey]>(data as string)] as const;
  }

  usePresence(CHANNEL, {}, (_presence) => {
    void channel.presence.get().then(setPresence);
  });

  const { channel } = useChannel(CHANNEL, (event) => {
    const duration = 5000;

    const [eventName, eventData] = getEventData(
      event.name as keyof Events,
      event.data as string
    );

    if (eventName.startsWith("draw")) {
      if (eventName === "draw.dealer") {
        const data = eventData as Events["draw.dealer"];
        utils.gamble.blackjack.state.setData(undefined, (oldData) => {
          oldData?.dealer.cards.push(
            data.card ? { ...data.card, hidden: false } : { hidden: true }
          );
          return { ...oldData } as typeof oldData;
        });
      } else {
        const data = eventData as Events["draw"];
        utils.gamble.blackjack.state.setData(undefined, (oldData) => {
          if (!oldData) return oldData;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const seat = oldData.seats[data.seat]!;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const deck = seat.deck[data.deck]!;
          deck.cards.push(data.card);
          return { ...oldData };
        });
      }
    }

    if (eventName === "split") {
      const data = eventData as Events["split"];
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const seat = oldData.seats[data.seat]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const deck = seat.deck[data.deck]!;
        seat.deck.push({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          cards: [deck.cards.pop()!],
          busted: false,
          bet: deck.bet,
        });
        return { ...oldData };
      });
    }

    if (eventName === "turn") {
      const data = eventData as Events["turn"];
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        oldData.turn = {
          playerId: data.playerId,
          seat: data.seat,
          deck: data.deck,
        };
        return { ...oldData };
      });
    }

    if (eventName === "show.dealer") {
      const data = eventData as Events["show.dealer"];
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        oldData.dealer.cards = oldData.dealer.cards.map((card) =>
          card.hidden ? data.card : card
        );
        return { ...oldData };
      });
    }

    if (eventName.startsWith("bust")) {
      if (eventName === "bust.dealer")
        toast.success(`Kurpiye battı.`, { duration });
      else {
        const data = eventData as Events["bust"];
        toast.success(`${getUsername(data.playerId)} battı.`, { duration });
      }
    }

    {
      const data = eventData as Events["win" | "tie" | "lose"];
      if (data.playerId === session.data?.user.id)
        void utils.payments.getWallet.invalidate();

      if (eventName === "win") {
        if (data.playerId === "dealer")
          toast.success(`Kurpiye kazandı.`, { duration });
        else
          toast.success(`${getUsername(data.playerId)} kazandı.`, { duration });
      }

      if (eventName === "tie") {
        if (data.playerId === "dealer")
          toast.success(`Kurpiye berabere.`, { duration });
        else
          toast.success(`${getUsername(data.playerId)} berabere.`, {
            duration,
          });
      }

      if (eventName === "lose") {
        if (data.playerId === "dealer")
          toast.success(`Kurpiye kaybetti.`, { duration });
        else
          toast.success(`${getUsername(data.playerId)} kaybetti.`, {
            duration,
          });
      }
    }

    if (eventName === "joined") {
      const data = eventData as Events["joined"];
      toast.success(`${getUsername(data.playerId)} katıldı.`, { duration });
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        oldData.seats[data.seat] = {
          playerId: data.playerId,
          deck: [{ cards: [], busted: false, bet: undefined }],
        };
        return { ...oldData };
      });
    }

    if (eventName === "created") {
      const data = eventData as Events["created"];

      toast.loading(
        `Oyun oluşturuldu, ${data.waitFor / 1000} saniye içinde başlayacak.`,
        { id: data.gameId, duration: data.waitFor }
      );
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        oldData.createdAt = new Date();
        oldData.startingAt = new Date(Date.now() + data.waitFor);
        oldData.dealer.cards = [];
        oldData.seats = data.seats;
        oldData.turn = { playerId: "dealer", seat: 0, deck: 0 };
        oldData.endedAt = undefined;
        oldData.gameId = data.gameId;
        return { ...oldData };
      });
      void utils.gamble.blackjack.invalidate();
    }

    if (eventName === "info.newDeck") {
      const data = eventData as Events["info.newDeck"];
      toast.success(
        `Yeni deste oluşturuldu, ${data.deckCount} deste, ${data.cardCount} kart.`,
        { duration }
      );
    }

    if (eventName === "bet") {
      const data = eventData as Events["bet"];
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const deck = oldData.seats[data.seat]!.deck[0]!;
        deck.bet = data.bet;
        return { ...oldData };
      });
      const game = utils.gamble.blackjack.state.getData();
      if (game?.seats[data.seat]?.playerId === session.data?.user.id)
        // TODO: Record<seat, bet>
        setBet(data.bet);
    }

    if (eventName === "started") {
      const gameId = eventData as Events["started"];
      toast.success("Oyun başladı, Bahisler kapatıldı. İyi şanslar!", {
        id: gameId,
        duration,
      });
      utils.gamble.blackjack.state.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        oldData.startingAt = new Date(); // invalidating (starting...) modal
        return { ...oldData };
      });
    }
    if (eventName === "ended") {
      toast.success("Oyun bitti.", { duration });
      void utils.gamble.blackjack.invalidate();
    }
    setLiveLogs((prev) => [...prev, event]);
  });

  useEffect(() => {
    const getHistory = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      let history = await channel.history({ start: twoHoursAgo.getTime() });
      do {
        history.items.forEach((event) => {
          setLogs((prev) => {
            if (!prev.find((e) => e.id === event.id)) {
              return [...prev, event];
            }
            return prev;
          });
        });
        history = await history.next();
      } while (history);
    };
    getHistory().catch(console.error);
  }, [channel]);

  return [channel, liveLogs, presence, logs, bet, setBet] as const;
}
