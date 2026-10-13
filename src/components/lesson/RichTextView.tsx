import { parseRichText } from "@/courses/richText";
import type { RichText } from "@/courses/types";
import { ReferenceLink } from "@/references/ReferenceLink";

/** Renders lesson inline markup: `code`, **bold**, and [term](ref:id) reference links. */
export function RichTextView({ text }: { text: RichText }) {
  return (
    <>
      {parseRichText(text).map((part, i) => {
        switch (part.kind) {
          case "text":
            return <span key={i}>{part.text}</span>;
          case "code":
            return (
              <code key={i} className="inline-code">
                {part.text}
              </code>
            );
          case "bold":
            return <strong key={i}>{part.text}</strong>;
          case "ref":
            return <ReferenceLink key={i} id={part.id} label={part.label} code={part.code} />;
        }
      })}
    </>
  );
}
