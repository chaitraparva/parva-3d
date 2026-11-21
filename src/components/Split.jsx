// Splits text into masked words (or chars) so GSAP can slide them up.
// Use "\n" for line breaks and *word* for italic words.
export function Words({ text, className = "", as: Tag = "span", italicClass = "it" }) {
  const lines = text.split("\n");
  return (
    <Tag className={`split ${className}`}>
      {lines.map((line, li) => (
        <span className="split-line" key={li}>
          {line.split(" ").map((w, wi) => {
            const italic = w.startsWith("*") && w.endsWith("*");
            const word = italic ? w.slice(1, -1) : w;
            return (
              <span className="w" key={wi}>
                <span className={italic ? italicClass : undefined}>{word}</span>
                {wi < line.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

export function Chars({ text, className = "" }) {
  return (
    <span className={`split ${className}`}>
      {text.split("\n").map((line, li) => (
        <span className="split-line" key={li}>
          {[...line].map((c, ci) => (
            <span className="c" key={ci}>{c === " " ? " " : c}</span>
          ))}
        </span>
      ))}
    </span>
  );
}
