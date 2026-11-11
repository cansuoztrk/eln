import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { spaceExists } from "@/features/auth/queries";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // First run: nothing exists yet, so the only useful place is setup.
  if (!(await spaceExists())) redirect("/setup");

  const { next } = await searchParams;
  return (
    <>
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-[13px] leading-relaxed text-muted">
        Burası yalnızca iki kişiye açık, özel bir yer.
      </p>
    </>
  );
}
