import type { Metadata } from "next";
import { getSectionDraft } from "@/features/content/queries";
import { SectionForm } from "@/features/studio/components/section-form";
import { FACTS } from "@/content/facts";
import { requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Metinler" };

export default async function StudioTextsPage() {
  const session = await requireOwner();
  const [hero, storyIntro, interlude, distance, meeting, song] = await Promise.all([
    getSectionDraft(session, "home.hero"),
    getSectionDraft(session, "story.intro"),
    getSectionDraft(session, "story.interlude"),
    getSectionDraft(session, "distance.intro"),
    getSectionDraft(session, "meeting.note"),
    getSectionDraft(session, "song"),
  ]);
  const empty = "Boş bırakırsan sayfada hiçbir şey görünmez; yerine başka bir metin konmaz.";

  return (
    <StudioPage
      title="Metinler"
      description="Sayfaların senin sesinle konuşan kısımları. Hepsi isteğe bağlı: yazmadığın yer sessiz kalır."
    >
      <div className="space-y-6">
        <SectionForm
          key={`hero-${JSON.stringify(hero.data)}`}
          sectionKey="home.hero"
          title="Ana sayfa"
          fields={[
            { name: "headline", label: "Ana cümle", kind: "text", maxLength: 200 },
            { name: "note", label: "Altındaki not", kind: "textarea", rows: 3, hint: empty, maxLength: 600 },
          ]}
          initial={hero.data}
          hasDraft={hero.hasDraft}
        />
        <SectionForm
          key={`story-${JSON.stringify(storyIntro.data)}`}
          sectionKey="story.intro"
          title="Hikâyemiz — giriş"
          fields={[{ name: "note", label: "Giriş notu", kind: "textarea", rows: 4, hint: empty, maxLength: 2000 }]}
          initial={storyIntro.data}
          hasDraft={storyIntro.hasDraft}
        />
        <SectionForm
          key={`interlude-${JSON.stringify(interlude.data)}`}
          sectionKey="story.interlude"
          title="Hikâyemiz — aradaki günler"
          description="Tanıştığınız günle sevgili olduğunuz gün arasındaki dönem. Sayfa gün sayısını kendisi hesaplar; o dönemi anlatmak sana kalır."
          fields={[{ name: "note", label: "O döneme dair", kind: "textarea", rows: 6, hint: empty, maxLength: 4000 }]}
          initial={interlude.data}
          hasDraft={interlude.hasDraft}
        />
        <SectionForm
          key={`distance-${JSON.stringify(distance.data)}`}
          sectionKey="distance.intro"
          title="Mesafe"
          fields={[{ name: "note", label: "Giriş notu", kind: "textarea", rows: 4, hint: empty, maxLength: 2000 }]}
          initial={distance.data}
          hasDraft={distance.hasDraft}
        />
        <SectionForm
          key={`meeting-${JSON.stringify(meeting.data)}`}
          sectionKey="meeting.note"
          title="Buluşacağımız gün"
          description="Tarih belli olana kadar site geri saymaz. Tarihi Tarihler bölümünden girersin; buraya yalnızca söylemek istediğini yaz."
          fields={[{ name: "note", label: "Not", kind: "textarea", rows: 5, hint: empty, maxLength: 4000 }]}
          initial={meeting.data}
          hasDraft={meeting.hasDraft}
        />
        <SectionForm
          key={`song-${JSON.stringify(song.data)}`}
          sectionKey="song"
          title={`Şarkımız — ${FACTS.song.artist}, ${FACTS.song.title}`}
          description="Şarkı dosyası siteye yüklenmez. Resmî bağlantıyı yapıştır; oynatıcı yalnızca biri oynat'a bastığında açılır."
          fields={[
            { name: "youtubeUrl", label: "YouTube bağlantısı", kind: "url", placeholder: "https://www.youtube.com/watch?v=…", maxLength: 300 },
            { name: "spotifyUrl", label: "Spotify bağlantısı", kind: "url", placeholder: "https://open.spotify.com/track/…", maxLength: 300 },
            { name: "note", label: "Şarkıya dair not", kind: "textarea", rows: 4, hint: empty, maxLength: 2000 },
          ]}
          initial={song.data}
          hasDraft={song.hasDraft}
        />
      </div>
    </StudioPage>
  );
}
