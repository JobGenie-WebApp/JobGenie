/**
 * Shared bits for the legal pages (privacy, terms, gdpr, pdpa).
 *
 * These four pages ship with summary copy, not reviewed legal text. `LegalNotice`
 * says so on every one of them — keep it until real text is approved, then delete
 * this component and the four usages together.
 */

export const legalBody = 'max-w-3xl text-[var(--jg-ink)]';

export function LegalNotice() {
  return (
    <p className="mb-10 rounded-lg border border-[var(--jg-line)] bg-amber-500/10 px-4 py-3 text-sm leading-6 text-[var(--jg-ink)]">
      <strong className="font-bold">Summary only.</strong> This page outlines our current practices in plain
      language. The full legal text is being prepared and will replace this summary once approved.
    </p>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 text-xl font-bold text-[var(--jg-ink)]">{title}</h2>
      <div className="space-y-3 text-base leading-7 text-[var(--jg-muted)]">{children}</div>
    </section>
  );
}
