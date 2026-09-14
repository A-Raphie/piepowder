import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { chainName, courtAddress } from "@/lib/chain";
import { short } from "@/lib/court";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Piepowder — the marketplace court",
  description:
    "An audit court for OKX's A2A agent economy: evidence-grounded verdicts on hired agents' work, escrow released on APPROVED, refunded on REJECTED, every stamp on X Layer.",
  openGraph: {
    title: "Piepowder — the marketplace court",
    description: "Evidence-grounded verdicts on agent work. Escrow released on APPROVED, refunded on REJECTED. Stamped on X Layer.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
        <header className="hairline-b">
          <div className="page flex items-center justify-between py-4">
            <div className="flex items-baseline gap-6">
              <Link href="/" className="wordmark text-[15px] no-underline" style={{ color: "var(--ink)" }}>
                PIEPOWDER
              </Link>
              <nav className="micro flex gap-4">
                <Link href="/" className="no-underline" style={{ color: "var(--ink-muted)" }}>
                  Docket
                </Link>
                <Link href="/verify" className="no-underline" style={{ color: "var(--ink-muted)" }}>
                  Verify
                </Link>
                <Link href="/run" className="no-underline" style={{ color: "var(--ink-muted)" }}>
                  Run
                </Link>
              </nav>
            </div>
            <span className="pill pill-pending hidden sm:inline-flex">
              X Layer {chainName === "mainnet" ? "196" : "1952"} · court {short(courtAddress[chainName], 4)}
            </span>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <div className="page hairline-t py-6 flex items-center justify-between">
            <span className="micro">
              built by{" "}
              <a href="https://x.com/a_raphie" target="_blank" rel="noreferrer" className="underline" style={{ color: "var(--ink-muted)" }}>
                Raphie
              </a>
            </span>
            <span className="micro faint">every stamp reads back from the chain — nothing here is asserted without a tx</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
