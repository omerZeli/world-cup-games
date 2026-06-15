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
  console.log('✅ Database initialised (matches table ready)');
}

export async function upsertMatches(matches) {
  if (!matches.length) return;

  for (const m of matches) {
    await pool.query(
      `INSERT INTO matches ("matchId", "homeTeam", "awayTeam", "utcDate", "status", "highlightUrl")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("matchId") DO UPDATE
         SET "status"       = EXCLUDED."status",
             "highlightUrl" = EXCLUDED."highlightUrl"`,
      [m.matchId, m.homeTeam, m.awayTeam, m.utcDate, m.status, m.highlightUrl ?? null]
    );
  }

  console.log(`💾 Upserted ${matches.length} matches to the database`);
}

export async function getMatches() {
  const { rows } = await pool.query(`SELECT * FROM matches ORDER BY "utcDate" ASC`);
  return rows;
}

export async function updateMatchWatched(matchId, watched) {
  const { rows } = await pool.query(
    `UPDATE matches SET "watched" = $1 WHERE "matchId" = $2 RETURNING *`,
    [watched, matchId]
  );
  return rows[0] ?? null;
}
