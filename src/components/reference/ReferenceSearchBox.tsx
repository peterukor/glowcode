import { Search } from "lucide-react";
import { useId, useState } from "react";

/**
 * The manual's search field. `onSearch` runs on every change when `live` (the manual's home
 * page shows results as you type) or on submit (the sidebar, which then opens the results).
 */
export function ReferenceSearchBox({
  initial = "",
  onSearch,
  live = false,
  autoFocus = false,
}: {
  initial?: string;
  onSearch: (query: string) => void;
  live?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const id = useId();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search the reference
      </label>
      <div className="flex items-center gap-2 rounded-2xl border-2 bg-card px-3 focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id={id}
          type="search"
          value={value}
          autoFocus={autoFocus}
          placeholder="Search: print, string uppercase, not defined…"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(e) => {
            setValue(e.target.value);
            if (live) onSearch(e.target.value);
          }}
        />
      </div>
    </form>
  );
}
