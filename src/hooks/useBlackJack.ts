/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type Types } from "ably";
import { useChannel, usePresence } from "ably/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import superjson from "superjson";
import {
  CARD_BACK,
  type Card as DeckCard,
} from "~/server/api/routers/gamble/blackjack/api";
import { type RouterOutputs, api } from "~/utils/api";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

type Game = RouterOutputs["gamble"]["blackjack"]["state"];

const CHANNEL = "gamble:blackjack";

// optimistic updates, toasts and logs
export function useBlackJackGame() {
  const users = useGetAbdullezizUsers();
  const utils = api.useContext();

  const [logs, setLogs] = useState<Array<Types.Message>>([]);
  const [liveLogs, setLiveLogs] = useState<Array<Types.Message>>([]);
  const [presence, setPresence] = useState<Array<Types.PresenceMessage>>([]);

  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  function getEventName(name: string) {
    if (name.includes(".")) {
      const [event, playerId] = name.split(".");
      return [event, playerId];
    }

    return [name, undefined];
  }

  usePresence(CHANNEL, {}, (_presence) => {
    void channel.presence.get().then(setPresence);
  });

  const { channel } = useChannel(CHANNEL, (event) => {
    const duration = 5000;
    const [eventName, playerId] = getEventName(event.name);

    if (eventName === "draw") {
      const eventData = superjson.parse<{
        gameId: string;
        card: DeckCard | null;
      }>(event.data as string);
      if (playerId === "dealer") {
        utils.gamble.blackjack.state.setData(undefined, (data) => {
          data?.dealer.cards.push(
            eventData.card
              ? { ...eventData.card, hidden: false }
              : { image: CARD_BACK, hidden: true }
          );
          return { ...data } as typeof data;
        });
      } else {
        if (eventData.card && playerId) {
          utils.gamble.blackjack.state.setData(undefined, (data) => {
            if (!data) return data;
            data.players[playerId]?.cards.push(eventData.card as DeckCard);
            return { ...data };
          });
        }
      }
    }

    if (eventName === "turn") {
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data || !playerId) return data;
        data.turn = playerId;
        return { ...data };
      });
    }

    if (eventName === "show" && playerId === "dealer") {
      const eventData = superjson.parse<{
        gameId: string;
        card: DeckCard & { hidden: false };
      }>(event.data as string);
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data) return data;
        data.dealer.cards = data.dealer.cards.map((card) =>
          card.hidden ? eventData.card : card
        );
        return { ...data };
      });
    }

    if (eventName === "bust") {
      if (playerId === "dealer") toast.success(`Kurpiye battı.`, { duration });
      else toast.success(`${getUsername(playerId)} battı.`, { duration });
    }

    if (eventName === "win") {
      if (playerId === "dealer")
        toast.success(`Kurpiye kazandı.`, { duration });
      else toast.success(`${getUsername(playerId)} kazandı.`, { duration });
    }

    if (eventName === "tie") {
      if (playerId === "dealer")
        toast.success(`Kurpiye berabere.`, { duration });
      else toast.success(`${getUsername(playerId)} berabere.`, { duration });
    }

    if (eventName === "lose") {
      if (playerId === "dealer")
        toast.success(`Kurpiye kaybetti.`, { duration });
      else toast.success(`${getUsername(playerId)} kaybetti.`, { duration });
    }

    if (eventName === "joined") {
      toast.success(`${getUsername(playerId)} katıldı.`, { duration });
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data || !playerId) return data;
        data.players[playerId] = {
          cards: [],
          busted: false,
        };
        return { ...data };
      });
    }

    if (event.name === "created") {
      const eventData = superjson.parse<{
        gameId: string;
        waitFor: number;
        players: NonNullable<Game>["players"];
      }>(event.data as string);

      toast.loading(
        `Oyun oluşturuldu, ${
          eventData.waitFor / 1000
        } saniye içinde başlayacak.`,
        {
          id: eventData.gameId,
          duration: eventData.waitFor,
        }
      );
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data) return data;
        data.createdAt = new Date();
        data.startingAt = new Date(Date.now() + eventData.waitFor);
        data.dealer.cards = [];
        data.players = eventData.players;
        data.turn = "dealer";
        data.endedAt = undefined;
        data.gameId = eventData.gameId;
        return { ...data };
      });
      void utils.gamble.blackjack.invalidate();
    }
    if (event.name === "started") {
      toast.success("Oyun başladı, Bahisler kapatıldı. İyi şanslar!", {
        id: event.data as string,
        duration,
      });
    }
    if (event.name === "ended") {
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
          setLogs((prev) => [...prev, event]);
        });
        history = await history.next();
      } while (history);
    };
    getHistory().catch(console.error);
  }, [channel]);

  return [channel, liveLogs, presence, logs] as const;
}
