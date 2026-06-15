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
