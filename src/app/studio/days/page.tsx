import type { Metadata } from "next";
import { listDates, viewerToday } from "@/features/dates/queries";
import { DaysStudio } from "@/features/days/components/days-studio";
import { listEditions, listSpecialDays } from "@/features/days/queries";
import { getPhotos, listAlbums } from "@/features/gallery/queries";
import { listMyLetters } from "@/features/letters/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Tarihler" };

export default async function StudioDaysPage() {
  const session = await requireOwner();
  const [dates, days, editions, letters, albums] = await Promise.all([
    listDates(session),
    listSpecialDays(session, { includeDrafts: true, includeDateless: true }),
    listEditions(session),
    listMyLetters(session),
    listAlbums(session, { includeDrafts: true }),
  ]);
  const photos = await getPhotos(session, [...days.map((d) => d.coverPhotoId), ...editions.map((e) => e.coverPhotoId)]);
  const today = viewerToday(session);

  const thumbs: Record<string, string> = {};
  for (const [id, photo] of photos) thumbs[id] = photo.image.thumb;

  const nextYear: Record<string, number> = {};
  for (const day of days) {
    nextYear[day.id] = day.when.kind === "recurring" ? day.when.next.year : day.when.kind === "upcoming" ? day.when.date.year : today.year;
  }

  return (
    <StudioPage
      title="Tarihler"
      description="İlişkinin tarihleri, onların etrafındaki özel gün sayfaları ve her yıl için hazırladığın baskılar."
    >
      <DaysStudio
        dates={dates}
        days={days.sort((a, b) => a.sortOrder - b.sortOrder)}
        editions={editions}
        letters={letters.map((l) => ({ id: l.id, title: l.title }))}
        albums={albums.map((a) => ({ id: a.id, title: a.title }))}
        thumbs={thumbs}
        partnerName={people(session).partner.name}
        nextYear={nextYear}
      />
    </StudioPage>
  );
}
