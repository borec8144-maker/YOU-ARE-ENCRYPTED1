
const sessions = globalThis.__YAE_SESSIONS__ ??= new Map();

function json(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            }
        }
    );
}

function validSessionId(value) {
    return (
        typeof value === "string" &&
        value.length >= 16 &&
        value.length <= 128 &&
        /^[A-Za-z0-9_-]+$/.test(value)
    );
}

export default async function handler(req) {

    if (req.method !== "POST") {
        return json({
            error: "METHOD_NOT_ALLOWED"
        }, 405);
    }

    let body;

    try {
        body = await req.json();
    } catch {
        return json({
            error: "INVALID_JSON"
        }, 400);
    }

    if (!body || !validSessionId(body.sessionId)) {
        return json({
            error: "INVALID_SESSION_ID"
        }, 400);
    }

    const verificationId =
        crypto.randomUUID();

    const now =
        Date.now();

    sessions.set(
        verificationId,
        {
            id: verificationId,
            sessionId: body.sessionId,
            status: "pending",
            createdAt: now,
            completedAt: null,
            keyIssued: false,
            lootlabsClickId: verificationId
        }
    );

    const destination =
        "https://locked-all.netlify.app/?verification=" +
        encodeURIComponent(verificationId);

    const apiUrl =
        "https://creators.lootlabs.gg/api/public/content_locker";

    const requestBody = {
        title: "YOU ARE ENCRYPTED",
        url: destination,
        tier_id: 1,
        number_of_tasks: 1,
        theme: 1
    };

    let lootLabsResponse;

    try {
        lootLabsResponse =
            await fetch(
                apiUrl,
                {
                    method: "POST",
                    headers: {
                        "Authorization":
                            `Bearer ${process.env.LOOTLABS_API_KEY}`,
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(requestBody)
                }
            );
    } catch {
        sessions.delete(verificationId);

        return json({
            error: "LOOTLABS_CONNECTION_FAILED"
        }, 502);
    }

    let lootLabsData;

    try {
        lootLabsData =
            await lootLabsResponse.json();
    } catch {
        sessions.delete(verificationId);

        return json({
            error: "LOOTLABS_INVALID_RESPONSE"
        }, 502);
    }

    if (
        !lootLabsResponse.ok ||
        lootLabsData?.type !== "created" ||
        !lootLabsData?.message?.loot_url
    ) {
        sessions.delete(verificationId);

        return json({
            error: "LOOTLABS_LINK_CREATION_FAILED"
        }, 502);
    }

    const baseLootUrl =
        lootLabsData.message.loot_url;

    const separator =
        baseLootUrl.includes("?")
            ? "&"
            : "?";

    const lootUrl =
        baseLootUrl +
        separator +
        "puid=" +
        encodeURIComponent(verificationId);

    return json({
        id: verificationId,
        status: "pending",
        offerUrl: lootUrl
    });
}

export const config = {
    path: "/api/verification/start"
};

