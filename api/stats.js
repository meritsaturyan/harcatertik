import { getSql, ensureSchema, QUESTION_KEYS } from "../lib/db.js";

function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = req.headers["authorization"] || "";
  let provided = "";
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    provided = header.slice(7).trim();
  } else if (req.headers["x-admin-password"]) {
    provided = String(req.headers["x-admin-password"]).trim();
  }
  if (!provided) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return res
      .status(500)
      .json({ error: "ADMIN_PASSWORD env variable is not configured" });
  }
  if (!isAuthorized(req)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="admin"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await ensureSchema();
    const sql = getSql();

    const totalRows = await sql`SELECT COUNT(*)::int AS total FROM submissions`;
    const total = totalRows[0]?.total ?? 0;

    const aggregateRows = await sql`
      SELECT 'q1' AS question, q1 AS value, COUNT(*)::int AS count FROM submissions GROUP BY q1
      UNION ALL SELECT 'q2',  q2,  COUNT(*)::int FROM submissions GROUP BY q2
      UNION ALL SELECT 'q3',  q3,  COUNT(*)::int FROM submissions GROUP BY q3
      UNION ALL SELECT 'q4',  q4,  COUNT(*)::int FROM submissions GROUP BY q4
      UNION ALL SELECT 'q5',  q5,  COUNT(*)::int FROM submissions GROUP BY q5
      UNION ALL SELECT 'q6',  q6,  COUNT(*)::int FROM submissions GROUP BY q6
      UNION ALL SELECT 'q7',  q7,  COUNT(*)::int FROM submissions GROUP BY q7
      UNION ALL SELECT 'q8',  q8,  COUNT(*)::int FROM submissions GROUP BY q8
      UNION ALL SELECT 'q9',  q9,  COUNT(*)::int FROM submissions GROUP BY q9
      UNION ALL SELECT 'q10', q10, COUNT(*)::int FROM submissions GROUP BY q10
      UNION ALL SELECT 'q11', q11, COUNT(*)::int FROM submissions GROUP BY q11
      UNION ALL SELECT 'q12', q12, COUNT(*)::int FROM submissions GROUP BY q12
      UNION ALL SELECT 'q13', q13, COUNT(*)::int FROM submissions GROUP BY q13
      UNION ALL SELECT 'q14', q14, COUNT(*)::int FROM submissions GROUP BY q14
      UNION ALL SELECT 'q15', q15, COUNT(*)::int FROM submissions GROUP BY q15
    `;

    const stats = {};
    for (const key of QUESTION_KEYS) stats[key] = [];
    for (const row of aggregateRows) {
      if (!stats[row.question]) continue;
      stats[row.question].push({ value: row.value, count: row.count });
    }
    for (const key of QUESTION_KEYS) {
      stats[key].sort((a, b) => b.count - a.count);
    }

    const submissions = await sql`
      SELECT
        id, organization_name, main_phone,
        q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15,
        contact_name, contact_email, contact_phone, comments,
        created_at
      FROM submissions
      ORDER BY created_at DESC
      LIMIT 1000
    `;

    return res.status(200).json({ total, stats, submissions });
  } catch (err) {
    console.error("stats error", err);
    return res
      .status(500)
      .json({ error: "Database error", detail: String(err.message || err) });
  }
}
