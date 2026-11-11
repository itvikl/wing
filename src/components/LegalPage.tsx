import { Header } from './Header';
import { Footer } from './Footer';
import { PageBackdrop } from './PageBackdrop';

/**
 * A privacy policy or accessibility statement: the admin's paragraphs, where
 * one starting with "## " is a heading. Plain, readable text on the inner
 * pages' backdrop — no motion, so it reads the same for everyone.
 */
export function LegalPage({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <div className="relative isolate flex min-h-screen min-h-dvh flex-col">
      <PageBackdrop />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 px-6 py-16 sm:py-20">
        <article className="mx-auto max-w-3xl rounded-3xl border border-white/15 bg-primary-dark/60 px-6 py-10 text-neutral-200 backdrop-blur-xl sm:px-12 sm:py-14">
          <h1 className="font-display text-3xl font-semibold text-neutral-100 md:text-4xl">{title}</h1>
          {paragraphs
            .filter((p) => p.trim())
            .map((paragraph, index) =>
              paragraph.startsWith('## ') ? (
                <h2 key={index} className="mt-10 font-display text-xl font-semibold text-accent-light md:text-2xl">
                  {paragraph.slice(3)}
                </h2>
              ) : (
                <p key={index} className="mt-4 text-base leading-relaxed md:text-lg">
                  {paragraph}
                </p>
              ),
            )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
