import type { ReactNode } from "react";

/** The heading every Studio screen starts with. */
export function StudioPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function StudioCard({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`paper p-5 sm:p-7 ${className ?? ""}`}>
      {title ? <h2 className="mb-5 font-display text-2xl text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}
