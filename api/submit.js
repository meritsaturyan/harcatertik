import { getSql, ensureSchema, QUESTION_KEYS } from "../lib/db.js";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      return resolve(req.body);
    }
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function clean(value, max = 500) {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const organization = clean(payload.organizationName, 200);
  const mainPhone = clean(payload.mainPhone, 50);
  if (!organization || !mainPhone) {
    return res.status(400).json({
      error: "organizationName and mainPhone are required",
    });
  }

  const answers = {};
  for (const key of QUESTION_KEYS) {
    answers[key] = clean(payload[key], 100);
  }

  const contactName = clean(payload.contactName, 200);
  const contactEmail = clean(payload.contactEmail, 200);
  const contactPhone = clean(payload.contactPhone, 50);
  const comments = clean(payload.comments, 2000);

  const userAgent = clean(req.headers["user-agent"], 400);
  const fwd = req.headers["x-forwarded-for"];
  const ip = clean(Array.isArray(fwd) ? fwd[0] : (fwd || "").split(",")[0], 80);

  try {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`
      INSERT INTO submissions (
        organization_name, main_phone,
        q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15,
        contact_name, contact_email, contact_phone, comments,
        user_agent, ip
      ) VALUES (
        ${organization}, ${mainPhone},
        ${answers.q1}, ${answers.q2}, ${answers.q3}, ${answers.q4}, ${answers.q5},
        ${answers.q6}, ${answers.q7}, ${answers.q8}, ${answers.q9}, ${answers.q10},
        ${answers.q11}, ${answers.q12}, ${answers.q13}, ${answers.q14}, ${answers.q15},
        ${contactName}, ${contactEmail}, ${contactPhone}, ${comments},
        ${userAgent}, ${ip}
      )
      RETURNING id, created_at
    `;
    return res.status(200).json({ ok: true, id: rows[0].id, createdAt: rows[0].created_at });
  } catch (err) {
    console.error("submit error", err);
    return res.status(500).json({ error: "Database error", detail: String(err.message || err) });
  }
}
