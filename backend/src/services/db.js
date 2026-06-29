import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      "matchId"      INTEGER      PRIMARY KEY,
      "homeTeam"     TEXT         NOT NULL,
      "awayTeam"     TEXT         NOT NULL,
      "utcDate"      TEXT         NOT NULL,
      "status"       TEXT         NOT NULL,
      "highlightUrl" TEXT
    )
  `);
  await pool.query(`
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS "watched" BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS worker_runs (
      id SERIAL PRIMARY KEY,
      ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      triggered_by TEXT NOT NULL DEFAULT 'scheduled'
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bracket_picks (
      round       INTEGER NOT NULL,
      match_index INTEGER NOT NULL,
      slot        INTEGER NOT NULL,
      team        TEXT    NOT NULL,
      PRIMARY KEY (round, match_index, slot)
    )
  `);
  console.log('✅ Database initialised (matches, worker_runs, bracket_picks tables ready)');
}

export async function getBracketPicks() {
  const { rows } = await pool.query(
    `SELECT round, match_index, slot, team FROM bracket_picks ORDER BY round, match_index, slot`
  );
  return rows;
}

export async function saveBracketPick(round, matchIndex, slot, team) {
  await pool.query(
    `INSERT INTO bracket_picks (round, match_index, slot, team)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (round, match_index, slot) DO UPDATE SET team = EXCLUDED.team`,
    [round, matchIndex, slot, team]
  );
}

export async function deleteBracketPick(round, matchIndex, slot) {
  await pool.query(
    `DELETE FROM bracket_picks WHERE round = $1 AND match_index = $2 AND slot = $3`,
    [round, matchIndex, slot]
  );
}

export async function upsertMatches(matches) {
  if (!matches.length) return;

  for (const m of matches) {
    await pool.query(
      `INSERT INTO matches ("matchId", "homeTeam", "awayTeam", "utcDate", "status", "highlightUrl")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("matchId") DO UPDATE
         SET "status"       = EXCLUDED."status",
             "highlightUrl" = COALESCE(EXCLUDED."highlightUrl", matches."highlightUrl")`,
      [m.matchId, m.homeTeam, m.awayTeam, m.utcDate, m.status, m.highlightUrl ?? null]
    );
  }

  console.log(`💾 Upserted ${matches.length} matches to the database`);
}

export async function getMatches() {
  const { rows } = await pool.query(`
    SELECT *
    FROM matches
    WHERE "utcDate"::timestamptz >= NOW() - INTERVAL '2 days'
    ORDER BY "utcDate"::timestamptz ASC
  `);
  return rows;
}

export async function getFinishedMatchesWithoutHighlight() {
  const { rows } = await pool.query(`
    SELECT *
    FROM matches
    WHERE "status" = 'FINISHED'
      AND "highlightUrl" IS NULL
      AND "utcDate"::timestamptz >= NOW() - INTERVAL '3 days'
    ORDER BY "utcDate"::timestamptz ASC
  `);
  return rows;
}

export async function updateHighlightUrl(matchId, highlightUrl) {
  await pool.query(
    `UPDATE matches SET "highlightUrl" = $1 WHERE "matchId" = $2`,
    [highlightUrl, matchId]
  );
}

export async function updateMatchWatched(matchId, watched) {
  const { rows } = await pool.query(
    `UPDATE matches SET "watched" = $1 WHERE "matchId" = $2 RETURNING *`,
    [watched, matchId]
  );
  return rows[0] ?? null;
}

export async function recordWorkerRun(triggeredBy) {
  const { rows } = await pool.query(
    `INSERT INTO worker_runs (triggered_by) VALUES ($1) RETURNING ran_at, triggered_by`,
    [triggeredBy]
  );
  return rows[0];
}

export async function getLastWorkerRun() {
  const { rows } = await pool.query(`
    SELECT ran_at, triggered_by
    FROM worker_runs
    ORDER BY ran_at DESC, id DESC
    LIMIT 1
  `);
  return rows[0] ?? null;
}
