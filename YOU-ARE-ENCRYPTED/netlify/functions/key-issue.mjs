
const sessions = globalThis.__YAE_SESSIONS__ ??= new Map();
const keys = globalThis.__YAE_KEYS__ ??= new Map();

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

function randomChars(length) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const bytes =
        new Uint8Array(length);

    crypto.getRandomValues(bytes);

    let output = "";

    for (let i = 0; i < length; i++) {
        output +=
            chars[bytes[i] % chars.length];
    }

    return output;
}

function generateKey() {
    return [
        randomChars(5),
        randomChars(5),
        randomChars(5),
        randomChars(5),
        randomChars(5)
    ].join("-");
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

    if (
        typeof body.verificationId !== "string" ||
        typeof body.sessionId !== "string"
    ) {
        return json({
            error: "INVALID_REQUEST"
        }, 400);
    }

    const session =
        sessions.get(
            body.verificationId
        );

    if (!session) {
        return json({
            error: "SESSION_NOT_FOUND"
        }, 404);
    }

    if (
        session.sessionId !==
        body.sessionId
    ) {
        return json({
            error: "SESSION_MISMATCH"
        }, 403);
    }

    if (session.status !== "completed") {
        return json({
            error: "VERIFICATION_NOT_COMPLETED"
        }, 403);
    }

    if (session.keyIssued) {
        return json({
            error: "KEY_ALREADY_ISSUED"
        }, 409);
    }

    const key =
        generateKey();

    const keyId =
        crypto.randomUUID();

    keys.set(
        key,
        {
            id: keyId,
            key,
            verificationId: session.id,
            createdAt: Date.now(),
            expiresAt:
                Date.now() +
                24 * 60 * 60 * 1000,
            used: false
        }
    );

    session.keyIssued = true;

    return json({
        key
    });
}

export const config = {
    path: "/api/keys/issue"
};

