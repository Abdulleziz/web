import Image from "next/image";
import { AbdullezizUser } from "~/components/AbdullezizUser";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

const urlRegex = /https:\/\/[^\s]+/g;
const mentionsRegex = /@\[([^\]]+)\]\(([^)]+)\)/;
const newLineOrSpaceRegex = /(\s|\n)/g;
const tokenRegex = new RegExp(
  `(${urlRegex.source})|(${mentionsRegex.source})|(${newLineOrSpaceRegex.source})|([^${newLineOrSpaceRegex.source}]+)`,
  "g"
);

export function tokenize(content: string, memes: string[] = []) {
  const result = [];
  const memesRegex =
    memes.length > 1 ? new RegExp(memes.join("|"), "gi") : undefined;
  // use memesRegex first and then use tokenRegex
  const regex = !!memesRegex
    ? new RegExp(`(${memesRegex.source})|(${tokenRegex.source})`, "gi")
    : tokenRegex;

  const tokens = content.match(regex);
  if (!tokens) throw new Error("no tokens found in tokenize()!");
  for (const token of tokens) {
    if (memesRegex && token.match(memesRegex)) {
      const matches = [...token.matchAll(memesRegex)];

      for (let i = 0; i < matches.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const match = matches[i]!;
        const meme = match[0];

        const prevMatch = matches[i - 1];
        const nextMatch = matches[i + 1];

        const after = nextMatch ? nextMatch.index : token.length;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const start = match.index!;
        const end = start + meme.length;

        const lhs = token.slice(0, start);
        const curr = token.slice(start, end);
        const rhs = token.slice(end, after);

        if (lhs && !prevMatch)
          result.push({ type: "text" as const, content: lhs } as const);
        result.push({ type: "meme" as const, content: curr } as const);
        if (rhs) result.push({ type: "text" as const, content: rhs } as const);
      }
    } else if (token === " ") {
      result.push({ type: "space", content: token } as const);
    } else if (token === "\n") {
      result.push({ type: "newline" as const, content: token } as const);
    } else if (token.match(urlRegex)) {
      // external if url does not match https://uploadthing.com/f/1621a05b-23cc-4cc5-85cb-c5b7757facdf-wpvi0o.jpg
      const data = { type: "url" as const, content: token } as const;
      const cdn = token.match(/https:\/\/uploadthing.com\/f\/[a-z0-9-]+/);
      if (!cdn) result.push({ ...data, cdn });
      else {
        const fileKey = token.split("/").pop();
        if (!fileKey) throw new Error("no file key found in tokenize()!");
        result.push({ ...data, cdn, fileKey });
      }
    } else if (token.match(mentionsRegex)) {
      const matches = token.match(mentionsRegex);
      if (!matches) continue;
      const userId = matches[2];
      const userName = matches[1];
      if (!userId || !userName) continue;
      result.push({
        type: "mention" as const,
        content: userName,
        userId,
      });
    } else {
      result.push({ type: "text" as const, content: token } as const);
    }
  }
  return result;
}

type Token = ReturnType<typeof tokenize>[number];

const extractUrl = (token: Token & { type: "url" }, key: number) => {
  const match = token.content.match(urlRegex);
  if (!match)
    throw new Error("This should never happen, but typescript is dumb");
  const url = match[0];
  const ext = url.split(".").pop();
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif") {
    // TODO: + discord cdn
    const Element = token.cdn ? Image : "img";
    return (
      <Element
        className="max-h-[10rem] max-w-[10rem] sm:max-h-[15rem] sm:max-w-[15rem] md:max-h-[20rem] md:max-w-[20rem]"
        key={key}
        src={url}
        width={1024}
        height={1024}
        alt="image"
      />
    );
  } else if (ext === "mp4" || ext === "webm" || ext === "ogg")
    return (
      <video
        className="max-h-[10rem] max-w-[10rem] sm:max-h-[15rem] sm:max-w-[15rem] md:max-h-[20rem] md:max-w-[20rem]"
        key={key}
        src={url}
        autoPlay
        onEnded={(e) => void e.currentTarget.play()}
      />
    );
  else if (url.includes("https://tenor.com/view")) {
    const tenorId = url.split("-").pop();
    if (!tenorId) return <p>Tenor id not found in link</p>;
    return (
      <>
        <iframe
          src={`https://tenor.com/embed/${tenorId}`}
          className="h-48 w-48 md:h-72 md:w-72"
        />
      </>
    );
  } else {
    const fileName =
      new URL(url).pathname
        .split("/")
        .pop() // last url segment
        ?.split("_") // id_filename
        .slice(1)
        .join("_") ?? "unknown";
    return (
      // TODO: attachment.name
      <a href={url} target="_blank">
        <Button variant="link" key={key}>
          {fileName}
        </Button>
      </a>
    );
  }
};

export const tokenizePostContent = (
  content: string,
  memes: { name: string; description: string }[]
) => {
  const rawTokens = tokenize(
    content,
    memes.map((meme) => meme.name)
  );
  const tokens: (string | JSX.Element)[] = [];
  const getLast = () => tokens.at(-1);
  const setLast = (content: string) => (tokens[tokens.length - 1] = content);

  rawTokens.forEach((token, i) => {
    const last = getLast();
    const lastIsText = typeof last === "string";

    if (["space", "text", "newline"].includes(token.type)) {
      if (lastIsText) setLast(last + token.content);
      else tokens.push(token.content);
    } else if (token.type === "url") {
      if (rawTokens.at(i - 1)?.type === "newline")
        tokens.push(<div className="w-full" key={`${i}-pre`} />);
      tokens.push(extractUrl(token, i));
    } else if (token.type === "meme") {
      return tokens.push(
        <Popover>
          <PopoverTrigger className="font-semibold underline">
            {token.content}
          </PopoverTrigger>
          <PopoverContent className="text-sm">
            {token.content}:{" "}
            {memes.find(
              (m) => m.name.toLowerCase() === token.content.toLowerCase()
            )?.description ?? "description not found."}
          </PopoverContent>
        </Popover>
      );
    } else if (token.type === "mention") {
      tokens.push(
        <AbdullezizUser
          variant="ghost"
          key={i}
          fallback={"@"}
          data={{ id: token.userId, name: token.content, image: null }}
        />
      );
    } else tokens.push(token.content);
  });
  return tokens;
};

export const notificationMessage = (
  content: string,
  options?: { slice?: number }
) => {
  let displayMessage = "";

  tokenize(content).forEach((lexem) => {
    if (lexem.type === "url")
      if (lexem.cdn) displayMessage += "🔗 Fotoğraf";
      else displayMessage += "🔗 Ek";
    else displayMessage += lexem.content;
  });

  return displayMessage.trim().slice(0, options?.slice ?? 200);
};
