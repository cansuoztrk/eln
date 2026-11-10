import { requireMember } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await requireMember();
  return (
    <div className="shell pt-40">
      <h1 className="font-display text-display">Merhaba {session.profile.display_name}</h1>
    </div>
  );
}
