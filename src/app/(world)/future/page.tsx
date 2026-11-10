import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FutureBoard } from "@/features/future/components/future-board";
import { listPlans } from "@/features/future/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Hayaller" };

export default async function FuturePage() {
  const session = await requireMember();
  const plans = await listPlans(session);
  const done = plans.filter((p) => p.state === "done").length;

  return (
    <>
      <PageHeader
        eyebrow="Our Future"
        title="Hayaller"
        align="center"
        lead={plans.length === 0 ? "Birlikte yapmak istediklerimizin listesi. Henüz boş; ilk hayali ikimizden biri ekleyebilir." : `${plans.length} hayal${done > 0 ? ` · ${done} tanesi gerçekleşti` : ""}`}
      />
      <div className="shell">
        <FutureBoard plans={plans} memoryBase={session.role === "owner" ? "/studio/story/" : "/story/write?id="} />
      </div>
    </>
  );
}
