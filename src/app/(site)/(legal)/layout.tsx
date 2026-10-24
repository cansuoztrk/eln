export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10">
      <article className="prose-lite mx-auto max-w-3xl">
        <p className="rounded-md border border-dashed border-warn bg-warn-soft px-4 py-3 text-[13px] text-warn-ink">
          Bu metin bir <strong>taslaktır</strong> ve hukuki açıdan yeterliliği bir uzman tarafından doğrulanmamıştır. Yayına almadan önce veri sorumlusu bilgileri ve süreçler hukuk danışmanıyla tamamlanmalıdır.
        </p>
        {children}
      </article>
    </div>
  );
}
