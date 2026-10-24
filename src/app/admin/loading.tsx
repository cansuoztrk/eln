export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="space-y-4">
      <div className="skeleton h-8 w-60" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-72" />
    </div>
  );
}
