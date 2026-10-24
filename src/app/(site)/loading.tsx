export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Yükleniyor">
      <div className="skeleton mb-3 h-8 w-64" />
      <div className="skeleton mb-8 h-4 w-96 max-w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-3.5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-6 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
