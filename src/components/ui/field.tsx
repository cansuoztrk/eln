import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control = [
  "w-full rounded-xl border border-line-strong bg-pearl px-4 text-[15px] text-ink",
  "placeholder:text-taupe/70",
  "transition-[border-color,box-shadow] duration-200",
  "hover:border-taupe/60",
  "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft/40",
  "disabled:cursor-not-allowed disabled:bg-beige/60 disabled:opacity-70",
  "aria-[invalid=true]:border-[#a94442] aria-[invalid=true]:ring-[#a94442]/15",
].join(" ");

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-32 resize-y py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        control,
        "h-12 appearance-none bg-[length:1rem] bg-[position:right_1rem_center] bg-no-repeat pr-10",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a7468%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("block text-[13px] font-medium tracking-wide text-ink-soft", className)} {...props} />;
}

type FieldProps = {
  /** Must match the control's `id`. */
  htmlFor: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A labelled control with an optional hint and an error line. The error is
 * announced to screen readers and linked through `aria-describedby` by id
 * convention: `${htmlFor}-error` / `${htmlFor}-hint`.
 */
export function Field({ htmlFor, label, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? <span className="text-xs text-taupe">isteğe bağlı</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[13px] leading-snug text-[#a94442]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props that wire a control to its Field's error/hint for assistive tech. */
export function describedBy(id: string, error?: string, hint?: unknown) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
