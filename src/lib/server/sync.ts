import { ensureSchema, type SavedRecordRow } from "@/lib/server/db";
import {
  buildFootballRows,
  type FootballPayload,
  type FootballRow,
} from "@/lib/server/football-model";
import { notifySavedRecordUpdated } from "@/lib/server/notifications";
import { getAppEnv } from "@/lib/server/runtime-env";
import { fetchFootballData } from "@/lib/server/upstream";

function rowChanged(previous: string | null, next: FootballRow) {
  if (!previous) return true;
  try {
    const oldRow = JSON.parse(previous) as FootballRow;
    return (
      JSON.stringify({
        profit: oldRow.profit,
        profitRate: oldRow.profitRate,
        updateTime: oldRow.updateTime,
        jcOdds: oldRow.jcOdds,
        platformOdds: oldRow.platformOdds,
      }) !==
      JSON.stringify({
        profit: next.profit,
        profitRate: next.profitRate,
        updateTime: next.updateTime,
        jcOdds: next.jcOdds,
        platformOdds: next.platformOdds,
      })
    );
  } catch {
    return true;
  }
}

export async function syncFootballData() {
  const env = getAppEnv();
  await ensureSchema(env.DB);

  const payload = (await fetchFootballData()) as FootballPayload;
  await env.DB.prepare("DELETE FROM snapshots").run();
  const inserted = await env.DB.prepare("INSERT INTO snapshots (payload) VALUES (?)")
    .bind(JSON.stringify(payload))
    .run();

  const rows = buildFootballRows(payload);
  const rowsByKey = new Map(rows.map((row) => [row.uniqueKey, row]));
  const saved = await env.DB.prepare(
    "SELECT id, user_id, saved_at, updated_at, match_id, unique_key, payload, current_payload FROM saved_records",
  ).all<SavedRecordRow>();

  let updatedSavedRecords = 0;

  for (const record of saved.results || []) {
    const nextRow = rowsByKey.get(record.unique_key);
    if (!nextRow || !rowChanged(record.current_payload || record.payload, nextRow)) continue;

    await env.DB.prepare(
      "UPDATE saved_records SET current_payload = ?, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(JSON.stringify(nextRow), record.id)
      .run();

    notifySavedRecordUpdated(record.user_id, {
      type: "saved_record_updated",
      savedRecordId: record.id,
      message: `${nextRow.home} VS ${nextRow.away} 已更新`,
      row: nextRow,
      createdAt: new Date().toISOString(),
    });

    updatedSavedRecords += 1;
  }

  return {
    snapshotId: inserted.meta.last_row_id,
    rows: rows.length,
    updatedSavedRecords,
  };
}

export async function getLatestLiveData() {
  const env = getAppEnv();
  await ensureSchema(env.DB);
  const snapshot = await env.DB.prepare(
    "SELECT id, captured_at, payload FROM snapshots ORDER BY id DESC LIMIT 1",
  ).first<{ id: number; captured_at: string; payload: string }>();

  if (!snapshot) {
    return {
      snapshotId: null,
      capturedAt: null,
      rows: [],
    };
  }

  const payload = JSON.parse(snapshot.payload) as FootballPayload;
  return {
    snapshotId: snapshot.id,
    capturedAt: snapshot.captured_at,
    rows: buildFootballRows(payload),
  };
}
