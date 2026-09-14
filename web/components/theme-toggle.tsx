"use client";

import { useEffect, useState } from "react";

/** Court canvases: noir (dashboard register) vs linen (document register). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"noir" | "linen">("noir");

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as "noir" | "linen") ?? "noir";
    setTheme(t);
  }, []);

  function pick(next: "noir" | "linen") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("court-theme", next);
    } catch {}
  }

  return (
    <div className="flex" style={{ border: "1px solid var(--hairline)", borderRadius: 7, overflow: "hidden" }}>
      {(["noir", "linen"] as const).map((t) => (
        <button
          key={t}
          onClick={() => pick(t)}
          aria-pressed={theme === t}
          className="mono cursor-pointer"
          style={{
            fontSize: "0.6875rem",
            letterSpacing: "0.08em",
            padding: "0.35rem 0.7rem",
            border: "none",
            background: theme === t ? "var(--surface-2)" : "transparent",
            color: theme === t ? "var(--ink)" : "var(--ink-faint)",
            cursor: "pointer",
          }}
        >
          {t === "noir" ? "NOIR" : "LINEN"}
        </button>
      ))}
    </div>
  );
}
