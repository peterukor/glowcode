import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

function useTheme() {
  // index.html applies the saved theme before first paint; read it back from there.
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this visit.
    }
  };
  return { dark, toggle };
}

export function SiteHeader() {
  const { dark, toggle } = useTheme();
  // Tighter on phones so four items fit in 360px.
  const size = "rounded-full px-2.5 py-2 text-[13px] font-semibold sm:px-4 sm:text-sm";
  const link = `${size} text-muted-foreground transition-colors hover:text-foreground`;
  const active = { className: `${size} bg-secondary text-secondary-foreground` };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Glowcode home">
          <img src={`${import.meta.env.BASE_URL}brand/glowcode-icon.png`} alt="" className="h-9 w-9 sm:hidden" />
          <img src={`${import.meta.env.BASE_URL}brand/glowcode-wordmark.png`} alt="Glowcode" className="hidden h-9 w-auto sm:block" />
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link to="/courses" className={link} activeProps={active}>
            Courses
          </Link>
          <Link to="/reference" className={link} activeProps={active}>
            Reference
          </Link>
          <Link to="/playground" className={link} activeProps={active}>
            Playground
          </Link>
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors hover:border-primary sm:h-10 sm:w-10"
          >
            {dark ? <Sun className="h-4 w-4 text-sun" /> : <Moon className="h-4 w-4 text-grape" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
