import { LogoMark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex justify-center">
          <LogoMark className="size-11" />
        </div>
        <div className="card p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
