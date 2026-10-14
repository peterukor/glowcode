import type { PyItem } from "@/types/python";
import { SegmentedSequence } from "./SegmentedSequence";

/** A list in the shared segmented container, with one item marked. */
export function ListView({ name, items, activeIndex }: { name: string; items: PyItem[]; activeIndex?: number }) {
  return (
    <SegmentedSequence
      label={name}
      items={items}
      states={activeIndex === undefined ? {} : { [activeIndex]: "active" }}
      focus={activeIndex === undefined ? undefined : { lo: activeIndex, hi: activeIndex }}
    />
  );
}

/** A string's characters in the shared segmented container, with one character marked. */
export function StringView({ name, text, activeIndex }: { name: string; text: string; activeIndex?: number }) {
  return (
    <SegmentedSequence
      label={name}
      items={[...text]}
      strings
      tone="str"
      states={activeIndex === undefined ? {} : { [activeIndex]: "active" }}
      focus={activeIndex === undefined ? undefined : { lo: activeIndex, hi: activeIndex }}
    />
  );
}
