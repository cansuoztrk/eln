/**
 * The confirmed facts, as Arda gave them. This is the only place they are
 * written in code; it seeds the database once, at setup. Mirrors
 * docs/ELN_CONTEXT.md — change both together, and only when Arda says so.
 *
 * Nothing here is invented: no events, no descriptions, no birth years.
 */

export const FACTS = {
  name: "ELNARE — Beyond Distance",
  tagline: "İstanbul'dan Bakü'ye, kalbimde sana ait küçük bir evren.",
  owner: {
    name: "Arda",
    city: "İstanbul",
    timezone: "Europe/Istanbul",
    birthday: { month: 11, day: 7 },
  },
  partner: {
    name: "Eln",
    fullName: "Elnare",
    city: "Bakü",
    timezone: "Asia/Baku",
    birthday: { month: 4, day: 23 },
  },
  dates: [
    {
      key: "met",
      label: "Tanıştığımız gün",
      kind: "milestone",
      person: null,
      month: 12,
      day: 6,
      year: 2025,
      recursYearly: true,
      happened: true,
      sortOrder: 10,
    },
    {
      key: "together",
      label: "Sevgili olduğumuz gün",
      kind: "milestone",
      person: null,
      month: 5,
      day: 21,
      year: 2026,
      recursYearly: true,
      happened: true,
      sortOrder: 20,
    },
    {
      key: "eln_birthday",
      label: "Eln'in doğum günü",
      kind: "birthday",
      person: "partner",
      month: 4,
      day: 23,
      // Birth year is not known, so no age is ever shown.
      year: null,
      recursYearly: true,
      happened: true,
      sortOrder: 30,
    },
    {
      key: "arda_birthday",
      label: "Arda'nın doğum günü",
      kind: "birthday",
      person: "owner",
      month: 11,
      day: 7,
      year: null,
      recursYearly: true,
      happened: true,
      sortOrder: 40,
    },
    {
      // Has not happened and has no date yet. No countdown until Arda sets one.
      key: "first_meeting",
      label: "İlk buluşmamız",
      kind: "future",
      person: null,
      month: null,
      day: null,
      year: null,
      recursYearly: false,
      happened: false,
      sortOrder: 50,
    },
  ],
  specialDays: [
    {
      slug: "eln-dogum-gunu",
      dateKey: "eln_birthday",
      title: "Eln'in Doğum Günü",
      theme: "birthday-partner",
      sortOrder: 10,
    },
    {
      slug: "arda-dogum-gunu",
      dateKey: "arda_birthday",
      title: "Arda'nın Doğum Günü",
      theme: "birthday-owner",
      sortOrder: 20,
    },
    {
      slug: "tanistigimiz-gun",
      dateKey: "met",
      title: "Tanıştığımız Gün",
      theme: "meeting",
      sortOrder: 30,
    },
    {
      slug: "sevgili-oldugumuz-gun",
      dateKey: "together",
      title: "Sevgili Olduğumuz Gün",
      theme: "together",
      sortOrder: 40,
    },
  ],
  // Two memories exist from day one: a title and a date each. The rest is Arda's to write.
  memories: [
    {
      title: "Tanıştığımız gün",
      happenedOn: "2025-12-06",
      dateKey: "met",
      category: "milestone",
      starSize: 5,
      starTone: "gold",
      sortOrder: 0,
    },
    {
      title: "Sevgili olduğumuz gün",
      happenedOn: "2026-05-21",
      dateKey: "together",
      category: "milestone",
      starSize: 5,
      starTone: "rose",
      sortOrder: 0,
    },
  ],
  song: {
    artist: "Onur Can Özcan",
    title: "Anılar Şarkısı",
    // The official links Arda gave, without the share-tracking parameters.
    youtubeUrl: "https://www.youtube.com/watch?v=bpMRUwYpNkM",
    spotifyUrl: "https://open.spotify.com/track/4TJCZsX5VjPZwUfho4mknR",
  },
} as const;

export const DATE_KEYS = {
  met: "met",
  together: "together",
  partnerBirthday: "eln_birthday",
  ownerBirthday: "arda_birthday",
  firstMeeting: "first_meeting",
} as const;
