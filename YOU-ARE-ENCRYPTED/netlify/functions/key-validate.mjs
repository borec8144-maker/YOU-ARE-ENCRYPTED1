
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
        !body ||
        typeof body.key !== "string"
    ) {
        return json({
            valid: false
        });
    }

    const key =
        body.key
            .trim()
            .toUpperCase();

    if (
        !/^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){4}$/.test(
            key
        )
    ) {
        return json({
            valid: false
        });
    }

    const record =
        keys.get(key);

    if (!record) {
        return json({
            valid: false
        });
    }

    if (
        record.used ||
        Date.now() >= record.expiresAt
    ) {
        return json({
            valid: false
        });
    }

    record.used = true;
    record.usedAt = Date.now();

    return json({
        valid: true
    });
}

export const config = {
    path: "/api/keys/validate"
};

