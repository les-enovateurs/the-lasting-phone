// API du mini-jeu (ex-backend Express du port 3010), sur D1 au lieu de MariaDB.
// Les pages statiques sont servies depuis frontend/dist (voir wrangler.jsonc) ;
// seuls /api/* et la vidéo passent par ce Worker.
const VIDEO_PATH = "/eco-anxiete-720.mov";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

async function getEvent(env, slug) {
  const event = await env.DB.prepare(
    "SELECT slug FROM event WHERE slug = ? AND ended_at IS NULL"
  ).bind(slug).first();
  return event ? json(event) : json({ error: "Event not found" }, 404);
}

async function createCustomer(env, request) {
  const {
    event_slug, name, email, accept_recontact, accept_newsletter,
    user_agent, device_brand, device_model, fabrication_date,
  } = await request.json();

  const event = await env.DB.prepare(
    "SELECT id FROM event WHERE slug = ? AND ended_at IS NULL"
  ).bind(event_slug ?? null).first();
  if (!event) return json({ error: "Event not found or already ended" }, 404);

  const smartphone_model =
    [device_brand?.trim(), device_model?.trim()].filter(Boolean).join(" ") || null;

  const inserted = await env.DB.prepare(
    `INSERT INTO customer (event_id, name, email, accept_recontact, accept_newsletter,
     user_agent, smartphone_model, date_fabrication)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    event.id, name, email,
    accept_recontact ? 1 : 0,
    accept_newsletter ? 1 : 0,
    user_agent, smartphone_model, fabrication_date ?? null
  ).first();
  const customerId = inserted.id;

  // Classement : rang du téléphone parmi ceux de l'event, du plus ancien au plus récent.
  const { rank, total } = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) + 1 FROM customer WHERE event_id = ?1
          AND date_fabrication IS NOT NULL AND date_fabrication < ?2) AS rank,
       (SELECT COUNT(*) FROM customer WHERE event_id = ?1
          AND date_fabrication IS NOT NULL) AS total`
  ).bind(event.id, fabrication_date ?? null).first();
  const percentile = Math.round((1 - rank / total) * 100);

  await env.DB.prepare("UPDATE customer SET rank = ? WHERE id = ?")
    .bind(rank, customerId).run();

  return json({ success: true, customerId, deviceRanking: { rank, total, percentile } });
}

// Vidéo trop lourde pour les assets Workers (25 Mio max) : elle reste avec les
// uploads WordPress et est relayée telle quelle, en-têtes Range compris, pour
// que l'adresse ttb.les-enovateurs.com/eco-anxiete-720.mov ne change pas.
const VIDEO_ORIGIN = "https://static.les-enovateurs.com/uploads/ttb/eco-anxiete-720.mov";

function serveVideo(request) {
  const headers = new Headers();
  for (const name of ["Range", "If-None-Match", "If-Modified-Since", "If-Range"]) {
    if (request.headers.has(name)) headers.set(name, request.headers.get(name));
  }
  return fetch(VIDEO_ORIGIN, { method: request.method, headers });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    try {
      if (pathname === VIDEO_PATH && (method === "GET" || method === "HEAD")) {
        return await serveVideo(request);
      }
      const eventMatch = pathname.match(/^\/api\/event\/([^/]+)$/);
      if (eventMatch && method === "GET") {
        return await getEvent(env, decodeURIComponent(eventMatch[1]));
      }
      if (pathname === "/api/customer" && method === "POST") {
        return await createCustomer(env, request);
      }
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error" }, 500);
    }
    return json({ error: "Not found" }, 404);
  },
};
