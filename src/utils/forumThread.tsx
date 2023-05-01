const urlRegex = /https:\/\/[^\s]+/g;

function tokenize(content: string) {
  const result = [];
  const words = content.split(/(\s|\n)/);
  for (const word of words) {
    if (word === " ") {
      result.push({ type: "space", content: word } as const);
    } else if (word === "\n") {
      result.push({ type: "newline" as const, content: word } as const);
    } else if (word.match(urlRegex)) {
      result.push({ type: "url" as const, content: word } as const);
    } else {
      result.push({ type: "text" as const, content: word } as const);
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
      <img className="max-h-xs max-w-xs" key={key} src={url} alt="image" />
    );
  else if (ext === "mp4" || ext === "webm" || ext === "ogg")
    return (
      <video
        className="max-h-xs max-w-xs"
        key={key}
        src={url}
        autoPlay
        onEnded={(e) => void e.currentTarget.play()}
      />
    );
  // unsupported media
  else return url;
};

export const tokenizePostContent = (content: string) => {
  const tokens = tokenize(content);
  return tokens.map((token, i) => {
    if (token.type === "url") return extractUrl(token, i);
    return token.content;
  });
};
