import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anon, cleanup, ensureWorld, future, past, TAG, type Client, type World } from "../helpers/db";

/**
 * The security proof. Each test states who may and who may not, and checks it
 * through the same API and row level security the app uses.
 */

let w: World;

beforeAll(async () => {
  w = await ensureWorld();
  await cleanup(w.spaceId);
});

afterAll(async () => {
  await cleanup(w.spaceId);
});

const ids = async (query: PromiseLike<{ data: { id: string }[] | null }>) => ((await query).data ?? []).map((row) => row.id);

async function letter(as: Client, fields: { status: "draft" | "published"; unlock_at?: string | null; title?: string }) {
  const { data, error } = await as
    .from("letters")
    .insert({ space_id: w.spaceId, title: fields.title ?? `${TAG} letter`, body: "secret body", status: fields.status, unlock_at: fields.unlock_at ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

describe("outsiders", () => {
  const tables = ["private_spaces", "profiles", "space_members", "relationship_dates", "photos", "letters", "memories", "media_assets", "journal_entries", "special_days", "daily_notes", "content_sections", "audit_logs"] as const;

  it("an anonymous visitor can read nothing", async () => {
    for (const table of tables) {
      const { data } = await anon.from(table).select("*").limit(1);
      expect(data ?? [], table).toHaveLength(0);
    }
  });

  it("a signed-in stranger who is not a member can read and write nothing", async () => {
    for (const table of tables) {
      const { data } = await w.stranger.from(table).select("*").limit(1);
      // A stranger may see their own profile row at most — they have none.
      expect(data ?? [], table).toHaveLength(0);
    }
    const insert = await w.stranger.from("letters").insert({ space_id: w.spaceId, title: `${TAG} intruder`, body: "x" });
    expect(insert.error).not.toBeNull();
    expect((await w.stranger.rpc("sealed_letters", { p_space: w.spaceId })).data ?? []).toHaveLength(0);
    expect((await w.stranger.rpc("ensure_daily_notes", { p_space: w.spaceId, p_day: "2026-11-10" })).error).not.toBeNull();
  });
});

describe("drafts are personal", () => {
  it("neither person sees the other's draft — the owner included", async () => {
    const ownerDraft = await letter(w.owner, { status: "draft" });
    const partnerDraft = await letter(w.partner, { status: "draft" });
    const published = await letter(w.owner, { status: "published" });

    expect(await ids(w.partner.from("letters").select("id").in("id", [ownerDraft, published]))).toEqual([published]);
    expect(await ids(w.owner.from("letters").select("id").eq("id", partnerDraft))).toEqual([]);
    expect(await ids(w.partner.from("letters").select("id").eq("id", partnerDraft))).toEqual([partnerDraft]);
  });

  it("applies to memories, journal entries and photos alike", async () => {
    const memory = await w.partner.from("memories").insert({ space_id: w.spaceId, title: `${TAG} memory` }).select("id").single();
    const entry = await w.partner.from("journal_entries").insert({ space_id: w.spaceId, title: `${TAG} entry`, body: "x" }).select("id").single();
    expect(memory.error).toBeNull();
    expect(entry.error).toBeNull();
    expect(await ids(w.owner.from("memories").select("id").eq("id", memory.data!.id))).toEqual([]);
    expect(await ids(w.owner.from("journal_entries").select("id").eq("id", entry.data!.id))).toEqual([]);
  });

  it("keeps a published 'only me' journal entry from the other person", async () => {
    const entry = await w.partner
      .from("journal_entries")
      .insert({ space_id: w.spaceId, title: `${TAG} private`, body: "x", status: "published", visibility: "private" })
      .select("id")
      .single();
    expect(await ids(w.owner.from("journal_entries").select("id").eq("id", entry.data!.id))).toEqual([]);
  });
});

describe("sealed content stays sealed", () => {
  it("a letter with a future date is unreadable; only its title and date are known", async () => {
    const id = await letter(w.owner, { status: "published", unlock_at: future(), title: `${TAG} sealed` });

    expect(await ids(w.partner.from("letters").select("id").eq("id", id))).toEqual([]);
    const sealed = (await w.partner.rpc("sealed_letters", { p_space: w.spaceId })).data ?? [];
    const row = sealed.find((s) => s.id === id);
    expect(row).toBeDefined();
    expect(Object.keys(row!)).not.toContain("body");

    await admin.from("letters").update({ unlock_at: past() }).eq("id", id);
    const opened = await w.partner.from("letters").select("id, body").eq("id", id);
    expect(opened.data).toHaveLength(1);
    expect(opened.data![0].body).toBe("secret body");
  });

  it("a time capsule and the files inside it wait for their day", async () => {
    const assetId = randomUUID();
    const asset = await w.owner.from("media_assets").insert({ id: assetId, space_id: w.spaceId, kind: "image", original_path: `${w.spaceId}/originals/${assetId}/original.jpg`, mime_type: "image/jpeg", original_filename: `${TAG} capsule.jpg` });
    expect(asset.error).toBeNull();
    await admin.from("media_assets").update({ state: "ready" }).eq("id", assetId);

    const capsule = await w.owner
      .from("time_capsules")
      .insert({ space_id: w.spaceId, title: `${TAG} capsule`, message: "secret", unlock_at: future(), status: "published" })
      .select("id")
      .single();
    expect(capsule.error).toBeNull();
    expect((await w.owner.from("time_capsule_items").insert({ capsule_id: capsule.data!.id, asset_id: assetId, space_id: w.spaceId })).error).toBeNull();

    expect(await ids(w.partner.from("time_capsules").select("id").eq("id", capsule.data!.id))).toEqual([]);
    expect(await ids(w.partner.from("media_assets").select("id").eq("id", assetId))).toEqual([]);
    expect(((await w.partner.rpc("sealed_capsules", { p_space: w.spaceId })).data ?? []).some((c) => c.id === capsule.data!.id)).toBe(true);

    const stored = await admin.from("media_assets").select("visibility, sealed_until").eq("id", assetId).single();
    expect(stored.data!.visibility).toBe("space");
    expect(stored.data!.sealed_until).not.toBeNull();

    await admin.from("time_capsules").update({ unlock_at: past() }).eq("id", capsule.data!.id);
    expect(await ids(w.partner.from("time_capsules").select("id").eq("id", capsule.data!.id))).toEqual([capsule.data!.id]);
    expect(await ids(w.partner.from("media_assets").select("id").eq("id", assetId))).toEqual([assetId]);
  });

  it("a special-day edition can be kept until the day itself", async () => {
    const day = await admin.from("special_days").select("id").eq("space_id", w.spaceId).limit(1).single();
    await admin.from("special_day_editions").delete().eq("special_day_id", day.data!.id).eq("year", 2199);
    const edition = await w.owner
      .from("special_day_editions")
      .insert({ space_id: w.spaceId, special_day_id: day.data!.id, year: 2199, title: `${TAG} edition`, note: "surprise", reveal_at: future(), status: "published" })
      .select("id")
      .single();
    expect(edition.error).toBeNull();
    expect(await ids(w.partner.from("special_day_editions").select("id").eq("id", edition.data!.id))).toEqual([]);
    const waiting = (await w.partner.rpc("sealed_editions", { p_space: w.spaceId })).data ?? [];
    expect(waiting.some((e) => e.id === edition.data!.id)).toBe(true);
    await admin.from("special_day_editions").delete().eq("id", edition.data!.id);
  });
});

describe("media follows the content that wraps it", () => {
  it("a file becomes visible only while a published photo uses it", async () => {
    const assetId = randomUUID();
    await w.owner.from("media_assets").insert({ id: assetId, space_id: w.spaceId, kind: "image", original_path: `${w.spaceId}/originals/${assetId}/original.jpg`, mime_type: "image/jpeg", original_filename: `${TAG} photo.jpg` });
    await admin.from("media_assets").update({ state: "ready" }).eq("id", assetId);
    const seen = async () => ids(w.partner.from("media_assets").select("id").eq("id", assetId));

    const photo = await w.owner.from("photos").insert({ space_id: w.spaceId, asset_id: assetId, caption: `${TAG} photo` }).select("id").single();
    expect(await seen()).toEqual([]);

    await w.owner.from("photos").update({ status: "published" }).eq("id", photo.data!.id);
    expect(await seen()).toEqual([assetId]);

    await w.owner.from("photos").update({ deleted_at: new Date().toISOString() }).eq("id", photo.data!.id);
    expect(await seen()).toEqual([]);

    await w.owner.from("photos").update({ deleted_at: null }).eq("id", photo.data!.id);
    expect(await seen()).toEqual([assetId]);

    await w.owner.from("photos").update({ status: "draft" }).eq("id", photo.data!.id);
    expect(await seen()).toEqual([]);
  });

  it("members cannot alter or remove media rows, nor reach storage with their own token", async () => {
    const assetId = randomUUID();
    await w.partner.from("media_assets").insert({ id: assetId, space_id: w.spaceId, kind: "image", original_path: `${w.spaceId}/originals/${assetId}/original.jpg`, mime_type: "image/jpeg", original_filename: `${TAG} locked.jpg` });
    await w.partner.from("media_assets").update({ visibility: "space", state: "ready" }).eq("id", assetId);
    await w.partner.from("media_assets").delete().eq("id", assetId);
    const row = await admin.from("media_assets").select("visibility, state").eq("id", assetId).single();
    expect(row.data).toEqual({ visibility: "private", state: "pending" });

    // A row may not be registered as already public or already verified.
    const forged = await w.partner.from("media_assets").insert({ space_id: w.spaceId, kind: "image", original_path: `${w.spaceId}/x/${randomUUID()}`, mime_type: "image/jpeg", visibility: "space", original_filename: `${TAG} forged.jpg` });
    expect(forged.error).not.toBeNull();

    expect((await w.partner.storage.from("media").list(w.spaceId)).data ?? []).toHaveLength(0);
    expect((await w.partner.storage.from("media").upload(`${w.spaceId}/intruder.txt`, "x")).error).not.toBeNull();
  });
});

describe("files cannot be borrowed", () => {
  it("a photo can only wrap its author's own upload, and cannot be re-pointed", async () => {
    const mine = randomUUID();
    const theirs = randomUUID();
    await w.owner.from("media_assets").insert({ id: mine, space_id: w.spaceId, kind: "image", original_path: `${w.spaceId}/originals/${mine}/original.jpg`, mime_type: "image/jpeg", original_filename: `${TAG} owner-private.jpg` });
    await w.partner.from("media_assets").insert({ id: theirs, space_id: w.spaceId, kind: "image", original_path: `${w.spaceId}/originals/${theirs}/original.jpg`, mime_type: "image/jpeg", original_filename: `${TAG} partner-own.jpg` });
    await admin.from("media_assets").update({ state: "ready" }).in("id", [mine, theirs]);

    // Wrapping the owner's private file in her own published photo must fail…
    const borrowed = await w.partner.from("photos").insert({ space_id: w.spaceId, asset_id: mine, caption: `${TAG} borrowed`, status: "published" });
    expect(borrowed.error).not.toBeNull();
    expect((await admin.from("media_assets").select("visibility").eq("id", mine).single()).data!.visibility).toBe("private");

    // …and so must re-pointing a photo of her own at it.
    const own = await w.partner.from("photos").insert({ space_id: w.spaceId, asset_id: theirs, caption: `${TAG} own photo` }).select("id").single();
    expect(own.error).toBeNull();
    expect((await w.partner.from("photos").update({ asset_id: mine }).eq("id", own.data!.id)).error).not.toBeNull();

    // A voice memory cannot wrap an image.
    expect((await w.partner.from("voice_memories").insert({ space_id: w.spaceId, asset_id: theirs, title: `${TAG} not audio` })).error).not.toBeNull();
  });

  it("an upload can only be registered at its own path", async () => {
    const id = randomUUID();
    const other = randomUUID();
    const base = { space_id: w.spaceId, kind: "image", mime_type: "image/jpeg", original_filename: `${TAG} path.jpg` };
    for (const original_path of [
      `${w.spaceId}/originals/${other}/original.jpg`, // someone else's slot
      `${w.spaceId}/variants/${id}/large.webp`, // a served variant
      `${randomUUID()}/originals/${id}/original.jpg`, // another space
      `${w.spaceId}/audio/${id}/original.jpg`, // wrong folder for an image
    ]) {
      expect((await w.partner.from("media_assets").insert({ ...base, id, original_path })).error, original_path).not.toBeNull();
    }
    expect((await w.partner.from("media_assets").insert({ ...base, id, original_path: `${w.spaceId}/originals/${id}/original.jpg` })).error).toBeNull();
  });
});

describe("authorship", () => {
  it("nobody rewrites or removes the other's letter", async () => {
    const mine = await letter(w.owner, { status: "published", title: `${TAG} owner letter` });
    const hers = await letter(w.partner, { status: "published", title: `${TAG} partner letter` });

    await w.partner.from("letters").update({ body: "changed" }).eq("id", mine);
    await w.partner.from("letters").delete().eq("id", mine);
    await w.owner.from("letters").update({ body: "changed" }).eq("id", hers);
    await w.owner.from("letters").delete().eq("id", hers);

    const rows = await admin.from("letters").select("id, body").in("id", [mine, hers]);
    expect(rows.data).toHaveLength(2);
    expect(rows.data!.every((r) => r.body === "secret body")).toBe(true);
  });

  it("authorship and the space of a row can never be changed", async () => {
    const mine = await letter(w.owner, { status: "published" });
    const stolen = await w.owner.from("letters").update({ created_by: w.partnerId }).eq("id", mine);
    expect(stolen.error).not.toBeNull();
    const moved = await w.owner.from("letters").update({ space_id: randomUUID() }).eq("id", mine);
    expect(moved.error).not.toBeNull();
  });

  it("the owner may tidy away a published memory of the partner's, and bring it back", async () => {
    const memory = await w.partner.from("memories").insert({ space_id: w.spaceId, title: `${TAG} shared memory`, status: "published" }).select("id").single();
    const trashed = await w.owner.from("memories").update({ deleted_at: new Date().toISOString() }).eq("id", memory.data!.id).select("id");
    expect(trashed.data).toHaveLength(1);
    expect(await ids(w.owner.from("memories").select("id").eq("id", memory.data!.id))).toEqual([memory.data!.id]);
    // …but cannot quietly turn it into a draft of its own.
    const hidden = await w.owner.from("memories").update({ status: "draft", deleted_at: null }).eq("id", memory.data!.id);
    expect(hidden.error).not.toBeNull();
  });
});

describe("what only the owner manages", () => {
  it("the partner cannot change dates, special days, albums, site copy or the theme", async () => {
    const date = await admin.from("relationship_dates").select("id, year").eq("space_id", w.spaceId).eq("key", "met").single();
    await w.partner.from("relationship_dates").update({ year: 1999 }).eq("id", date.data!.id);
    expect((await admin.from("relationship_dates").select("year").eq("id", date.data!.id).single()).data!.year).toBe(date.data!.year);

    expect((await w.partner.from("relationship_dates").insert({ space_id: w.spaceId, key: "rls_x", label: "x", kind: "custom", month: 1, day: 1 })).error).not.toBeNull();
    expect((await w.partner.from("albums").insert({ space_id: w.spaceId, title: `${TAG} album` })).error).not.toBeNull();
    expect((await w.partner.from("content_sections").insert({ space_id: w.spaceId, key: "rls.x", data: {} })).error).not.toBeNull();
    expect((await w.partner.from("daily_notes").insert({ space_id: w.spaceId, body: `${TAG} note` })).error).not.toBeNull();
    expect((await w.partner.from("space_members").insert({ space_id: w.spaceId, user_id: w.strangerId, role: "owner" })).error).not.toBeNull();
  });

  it("the owner's unpublished site copy and the invitations are invisible to the partner", async () => {
    expect((await w.owner.from("content_section_drafts").upsert({ space_id: w.spaceId, key: "rls.draft", data: { note: "wip" } }, { onConflict: "space_id,key" })).error).toBeNull();
    expect((await w.partner.from("content_section_drafts").select("key")).data ?? []).toHaveLength(0);
    expect((await w.partner.from("space_invites").select("id")).data ?? []).toHaveLength(0);
  });

  it("a note for a day that has not come is not readable early", async () => {
    const note = await w.owner.from("daily_notes").insert({ space_id: w.spaceId, body: `${TAG} tomorrow's note`, status: "published" }).select("id").single();
    expect(note.error).toBeNull();
    // Published, but not yet assigned to any day.
    expect(await ids(w.partner.from("daily_notes").select("id").eq("id", note.data!.id))).toEqual([]);
    expect(await ids(w.owner.from("daily_notes").select("id").eq("id", note.data!.id))).toEqual([note.data!.id]);
    // The schedule itself cannot be written by members.
    expect((await w.partner.from("daily_note_schedule").insert({ space_id: w.spaceId, day: "2020-01-01", note_id: note.data!.id })).error).not.toBeNull();
  });
});

describe("which rooms have something in them", () => {
  const today = new Date().toISOString().slice(0, 10);
  const ask = (as: Client) => as.rpc("room_presence", { p_space: w.spaceId, p_day: today }).maybeSingle();

  it("is answered for members only", async () => {
    expect((await anon.rpc("room_presence", { p_space: w.spaceId, p_day: today })).error).not.toBeNull();
    expect((await w.stranger.rpc("room_presence", { p_space: w.spaceId, p_day: today })).error).not.toBeNull();
    const mine = await ask(w.partner);
    expect(mine.error).toBeNull();
    for (const room of ["gallery", "letters", "reasons", "capsules"] as const) expect(typeof mine.data![room]).toBe("boolean");
  });

  it("counts only what the asker may already read", async () => {
    const before = (await ask(w.partner)).data!;
    // Meaningful on an empty room; on a room that already has letters there is nothing left to prove.
    if (before.letters) return;
    await letter(w.owner, { status: "draft" });
    expect((await ask(w.partner)).data!.letters).toBe(false);
    // A sealed envelope does open the room: its title and date are shown there.
    await letter(w.owner, { status: "published", unlock_at: future() });
    expect((await ask(w.partner)).data!.letters).toBe(true);
  });
});

describe("questions answered together", () => {
  it("hides the other answer until you have written yours", async () => {
    const question = await w.owner.from("questions").insert({ space_id: w.spaceId, prompt: `${TAG} together?`, together: true }).select("id").single();
    const ownerAnswer = await w.owner.from("answers").insert({ space_id: w.spaceId, question_id: question.data!.id, body: `${TAG} owner answer` }).select("id").single();
    expect(ownerAnswer.error).toBeNull();

    expect(await ids(w.partner.from("answers").select("id").eq("question_id", question.data!.id))).toEqual([]);
    await w.partner.from("answers").insert({ space_id: w.spaceId, question_id: question.data!.id, body: `${TAG} partner answer` });
    expect(await ids(w.partner.from("answers").select("id").eq("question_id", question.data!.id))).toHaveLength(2);
  });
});

describe("privileged operations", () => {
  it("setup, invite acceptance and the rate limiter cannot be called by members or visitors", async () => {
    for (const client of [anon, w.partner, w.owner]) {
      expect((await client.rpc("bootstrap_space", { p_owner: w.partnerId, p_config: {} })).error).not.toBeNull();
      expect((await client.rpc("accept_invite", { p_token_hash: "x".repeat(64), p_user: w.strangerId, p_profile: {} })).error).not.toBeNull();
      expect((await client.rpc("check_rate_limit", { p_key: "k".repeat(32), p_max: 1, p_window_seconds: 60 })).error).not.toBeNull();
    }
  });

  it("setup refuses to run twice, and there can only ever be one space", async () => {
    expect((await admin.rpc("bootstrap_space", { p_owner: w.strangerId, p_config: { name: "second" } })).error?.message).toMatch(/already been set up/);
    const second = await admin.from("private_spaces").insert({ name: "second", owner_name: "a", partner_name: "b", owner_city: "x", partner_city: "y", owner_timezone: "UTC", partner_timezone: "UTC", created_by: w.strangerId });
    expect(second.error).not.toBeNull();
  });

  it("an expired, revoked or used invitation is refused", async () => {
    const make = async (fields: Record<string, string>) => {
      const hash = createHash("sha256").update(randomBytes(16)).digest("hex");
      await admin.from("space_invites").insert({ space_id: w.spaceId, token_hash: hash, email: "rls-invitee@example.test", expires_at: future(1), created_by: w.ownerId, ...fields });
      return hash;
    };
    for (const hash of [await make({ expires_at: past() }), await make({ revoked_at: past() }), await make({ accepted_at: past() })]) {
      expect((await admin.rpc("accept_invite", { p_token_hash: hash, p_user: w.strangerId, p_profile: {} })).error?.message).toMatch(/not valid/);
    }
    const members = await admin.from("space_members").select("user_id").eq("space_id", w.spaceId);
    expect(members.data!.some((m) => m.user_id === w.strangerId)).toBe(false);
  });

  it("the rate limiter allows a few attempts, then stops", async () => {
    const key = randomBytes(24).toString("hex");
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) results.push((await admin.rpc("check_rate_limit", { p_key: key, p_max: 3, p_window_seconds: 60 })).data === true);
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("history is kept without watching anyone", () => {
  it("earlier versions of a letter are kept, for its author only", async () => {
    const id = await letter(w.partner, { status: "published", title: `${TAG} versioned` });
    await w.partner.from("letters").update({ body: "second version" }).eq("id", id);

    const mine = await w.partner.from("content_versions").select("snapshot").eq("entity_id", id);
    expect(mine.data).toHaveLength(1);
    expect((mine.data![0].snapshot as { body: string }).body).toBe("secret body");
    expect((await w.owner.from("content_versions").select("id").eq("entity_id", id)).data ?? []).toHaveLength(0);
  });

  it("the change log shows the owner shared changes, never the partner's drafts", async () => {
    const draft = await letter(w.partner, { status: "draft", title: `${TAG} logged draft` });
    const shared = await letter(w.partner, { status: "published", title: `${TAG} logged shared` });
    const seen = await w.owner.from("audit_logs").select("entity_id").in("entity_id", [draft, shared]);
    expect((seen.data ?? []).map((r) => r.entity_id)).toEqual([shared]);
  });
});
