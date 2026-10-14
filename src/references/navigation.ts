import { createContext, useContext } from "react";
import { referencePath } from "./registry";

/**
 * How "See more" and related-entry links reach a full reference page. The app provides a
 * router-aware version (it remembers which lesson the student came from, so they can get
 * back to the same place). Without a provider, links are plain hrefs: that's what tests and
 * any future host, like a code editor panel, get by default.
 */
export type ReferenceNavigation = {
  /** The URL of an entry's page. */
  hrefFor: (id: string) => string;
  /** Opens an entry in place of a full page load. Return true if it handled the click. */
  open?: (id: string) => boolean;
};

export const ReferenceNavigationContext = createContext<ReferenceNavigation>({ hrefFor: referencePath });

export const useReferenceNavigation = () => useContext(ReferenceNavigationContext);

/**
 * Where a student came from, carried in the URL of reference pages:
 * `from` is the lesson path, `hops` how many reference pages they've opened since leaving it.
 * "Back to lesson" goes back that many steps in history, which restores the lesson's scroll
 * position, and falls back to opening `from` when there's no history (a shared link).
 */
export type ReferenceOrigin = { from?: string; hops?: number };

/** Only same-site lesson paths are accepted, so the parameter can't send students elsewhere. */
export function parseOrigin(search: Record<string, unknown>): ReferenceOrigin {
  const from = typeof search.from === "string" && /^\/courses\/[\w-]+\/[\w-]+$/.test(search.from) ? search.from : undefined;
  const hops = Number(search.hops);
  return from ? { from, hops: Number.isInteger(hops) && hops > 0 && hops < 100 ? hops : 1 } : {};
}

/** The origin to put on the next reference page, given where the student is now. */
export function nextOrigin(pathname: string, current: ReferenceOrigin): ReferenceOrigin {
  if (pathname.startsWith("/reference")) return current.from ? { from: current.from, hops: (current.hops ?? 1) + 1 } : {};
  return /^\/courses\/[\w-]+\/[\w-]+$/.test(pathname) ? { from: pathname, hops: 1 } : {};
}
