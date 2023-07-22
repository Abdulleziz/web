import Link from "next/link";

const urlRegex = /https:\/\/[^\s]+/g;
const mentionsRegex = /@\[([^\]]+)\]\(([^)]+)\)/;
const newLineOrSpaceRegex = /(\s|\n)/g;
const tokenRegex = new RegExp(
  `(${urlRegex.source})|(${mentionsRegex.source})|(${newLineOrSpaceRegex.source})|([^${newLineOrSpaceRegex.source}]+)`,
  "g"
);

function tokenize(content: string) {
  const result = [];
  const tokens = content.match(tokenRegex);
  if (!tokens) throw new Error("no tokens found in tokenize()!");
  for (const token of tokens) {
    if (token === " ") {
      result.push({ type: "space", content: token } as const);
    } else if (token === "\n") {
      result.push({ type: "newline" as const, content: token } as const);
    } else if (token.match(urlRegex)) {
      result.push({ type: "url" as const, content: token } as const);
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
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif")
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="max-h-[10rem] max-w-[10rem] sm:max-h-[15rem] sm:max-w-[15rem] md:max-h-[20rem] md:max-w-[20rem]"
        key={key}
        src={url}
        alt="image"
      />
    );
  else if (ext === "mp4" || ext === "webm" || ext === "ogg")
    return (
      <video
        className="max-h-[10rem] max-w-[10rem] sm:max-h-[15rem] sm:max-w-[15rem] md:max-h-[20rem] md:max-w-[20rem]"
        key={key}
        src={url}
        autoPlay
        onEnded={(e) => void e.currentTarget.play()}
      />
    );
  // unsupported media
  else if (url.includes("https://tenor.com/view"))
    // TODO: custom tenor api endpoint
    return (
      <a key={key} className="link-error link" href={url}>
        *tenor gif not supported yet*
      </a>
    );
  else return url;
};

export const tokenizePostContent = (content: string) => {
  const rawTokens = tokenize(content);
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
    } else if (token.type === "mention") {
      tokens.push(
        <Link
          className="link-secondary link"
          href={`/profiles/${token.userId}`}
          key={i}
        >
          @{token.content}
        </Link>
      );
    } else tokens.push(token.content);
  });
  return tokens;
};
