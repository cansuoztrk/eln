import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Recorder } from "@/features/voice/components/recorder";
import { VoiceList } from "@/features/voice/components/voice-list";
import { listVoices } from "@/features/voice/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sesli Anılar" };

export default async function VoicePage() {
  const session = await requireMember();
  const voices = await listVoices(session);

  return (
    <>
      <PageHeader eyebrow="Voice Memories" title="Sesli Anılar" align="center" lead="Bazı şeyler yazıyla değil, sesle saklanır." />
      <div className="shell-narrow space-y-10">
        <Recorder />
        {voices.length > 0 ? <VoiceList voices={voices} /> : <p className="text-center text-muted">Henüz bir ses kaydı yok.</p>}
      </div>
    </>
  );
}
