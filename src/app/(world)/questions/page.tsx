import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Questions } from "@/features/questions/components/questions";
import { listQuestions } from "@/features/questions/queries";
import { people, requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sorular" };

export default async function QuestionsPage() {
  const session = await requireMember();
  const questions = await listQuestions(session);
  const { me, other } = people(session);

  return (
    <>
      <PageHeader
        eyebrow="Our Questions"
        title="Sorular"
        align="center"
        lead={questions.length === 0 ? "Henüz soru yok. Kendi sorunu ekleyebilir ya da başlangıç sorularıyla başlayabilirsin." : "Puan yok, süre yok. İstediğine, istediğin zaman cevap ver."}
      />
      <div className="shell">
        <Questions questions={questions} myName={me.name} otherName={other.name} />
      </div>
    </>
  );
}
