
const sessions = globalThis.__YAE_SESSIONS__ ??= new Map();
const completedClicks = globalThis.__YAE_LOOTLABS_COMPLETED__ ??= new Set();

function response(message, status = 200) {
    return new Response(message, {
        status,
        headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "no-store"
        }
    });
}

export default async function handler(req) {

    if (req.method !== "GET") {
        return response("METHOD_NOT_ALLOWED", 405);
    }

    const url = new URL(req.url);

    const clickId =
        url.searchParams.get("click_id");

    const ip =
        url.searchParams.get("ip");

    const uniqueId =
        url.searchParams.get("unique_id");

    if (!clickId || !uniqueId) {
        return response("MISSING_PARAMETERS", 400);
    }

    if (completedClicks.has(uniqueId)) {
        return response("ALREADY_COMPLETED");
    }

    const session =
        sessions.get(clickId);

    if (!session) {
        return response("SESSION_NOT_FOUND", 404);
    }

    if (session.status !== "pending") {
        return response("SESSION_NOT_PENDING");
    }

    session.status = "completed";
    session.completedAt = Date.now();
    session.lootlabs = {
        clickId,
        uniqueId,
        ip: ip || null
    };

    completedClicks.add(uniqueId);

    return response("OK");
}

export const config = {
    path: "/api/lootlabs-postback"
};

