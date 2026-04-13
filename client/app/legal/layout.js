import Link from "next/link";

export default function LegalLayout({ children }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-baseline justify-between gap-4 flex-wrap">
          <Link href="/" className="font-display text-3xl font-black italic leading-none no-underline" style={{ color: "var(--paper)" }}>
            Rando<span style={{ color: "var(--tomato)" }}>Chat</span>
          </Link>
          <nav className="flex gap-3 text-xs" style={{ fontFamily: "Space Grotesk" }}>
            <Link href="/legal/terms" style={{ color: "var(--paper-dim)" }}>terms</Link>
            <Link href="/legal/privacy" style={{ color: "var(--paper-dim)" }}>privacy</Link>
            <Link href="/legal/refunds" style={{ color: "var(--paper-dim)" }}>refunds</Link>
            <Link href="/" style={{ color: "var(--tomato)" }}>← back</Link>
          </nav>
        </header>
        <article className="card p-6 sm:p-8 prose-custom" style={{ color: "var(--ink)" }}>
          {children}
        </article>
        <footer className="mt-8 text-xs opacity-50 text-center">
          these documents are templates. get a real lawyer to review before you rely on them.
        </footer>
      </div>
      <style>{`
        .prose-custom h1 { font-family: "Fraunces", serif; font-style: italic; font-weight: 900; font-size: 2rem; line-height: 1.1; margin-bottom: 0.4rem; }
        .prose-custom h2 { font-family: "Fraunces", serif; font-style: italic; font-weight: 700; font-size: 1.3rem; margin-top: 1.8rem; margin-bottom: 0.4rem; }
        .prose-custom p  { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.9rem; }
        .prose-custom ul { font-size: 0.95rem; line-height: 1.55; margin-bottom: 0.9rem; padding-left: 1.2rem; }
        .prose-custom li { margin-bottom: 0.3rem; list-style: disc; }
        .prose-custom strong { font-weight: 700; }
        .prose-custom .meta { font-size: 0.75rem; color: #555; margin-bottom: 1.5rem; font-style: italic; }
        .prose-custom a { color: #cc3409; text-decoration: underline; }
      `}</style>
    </main>
  );
}
