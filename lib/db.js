import { neon } from "@neondatabase/serverless";

let _sql = null;
let _schemaReady = false;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Provision Neon Postgres on Vercel (vercel integration add neon) and pull env vars."
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

export async function ensureSchema() {
  if (_schemaReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      organization_name TEXT NOT NULL,
      main_phone TEXT NOT NULL,
      q1 TEXT,
      q2 TEXT,
      q3 TEXT,
      q4 TEXT,
      q5 TEXT,
      q6 TEXT,
      q7 TEXT,
      q8 TEXT,
      q9 TEXT,
      q10 TEXT,
      q11 TEXT,
      q12 TEXT,
      q13 TEXT,
      q14 TEXT,
      q15 TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      comments TEXT,
      user_agent TEXT,
      ip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  _schemaReady = true;
}

export const QUESTION_KEYS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
];
