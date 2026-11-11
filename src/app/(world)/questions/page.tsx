import type { Metadata } from "next";
import { COPY } from "@/content/copy";
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
        lead={questions.length === 0 ? COPY.questions.leadEmpty : COPY.questions.lead}
      />
      <div className="shell">
        <Questions questions={questions} myName={me.name} otherName={other.name} />
      </div>
    </>
  );
}
