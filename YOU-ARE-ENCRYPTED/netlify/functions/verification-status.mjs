
const sessions = globalThis.__YAE_SESSIONS__ ??= new Map();

function json(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*"
            }
        }
    );
}

export default async function handler(req) {

    if (req.method !== "GET") {
        return json({
            error: "METHOD_NOT_ALLOWED"
        }, 405);
    }

    const url =
        new URL(req.url);

    const id =
        url.searchParams.get("id");

    if (!id) {
        return json({
            error: "MISSING_ID"
        }, 400);
    }

    const session =
        sessions.get(id);

    if (!session) {
        return json({
            error: "SESSION_NOT_FOUND"
        }, 404);
    }

    if (
        session.status === "pending" &&
        Date.now() - session.createdAt >
        10 * 60 * 1000
    ) {
        session.status = "expired";
    }

    return json({
        id: session.id,
        status: session.status
    });
}

export const config = {
    path: "/api/verification/status"
};

