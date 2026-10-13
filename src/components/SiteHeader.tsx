import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  const link = "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground";
  const active = { className: "rounded-full px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground" };
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-mono text-sm font-bold text-primary-foreground shadow-soft">{">_"}</span>
          <span className="font-display text-xl font-extrabold">Glowcode</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/playground" className={link} activeProps={active}>Playground</Link>
          <Link to="/lessons" className={link} activeProps={active}>Lessons</Link>
          <button onClick={toggle} aria-label="Toggle dark mode" className="ml-2 grid h-10 w-10 place-items-center rounded-full border-2 transition-colors hover:border-primary">
            {dark ? <Sun className="h-4 w-4 text-sun" /> : <Moon className="h-4 w-4 text-grape" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
