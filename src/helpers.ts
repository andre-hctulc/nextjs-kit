import { NextRequest } from "next/server";
import { ServerError } from "./server-error";

export async function parseJSON<T = any>(request: NextRequest): Promise<T> {
    if (request.headers.get("Content-Type") !== "application/json") {
        throw new ServerError("Expected content type application/json", {
            status: /* Not Accepted */ 406,
            userMessage: true,
        });
    }

    try {
        return await request.json();
    } catch (err) {
        throw new ServerError("Failed to decode JSON", { status: 400, cause: err });
    }
}

export async function parseFormData(request: NextRequest): Promise<FormData> {
    if (!request.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
        throw new ServerError("Expected content type multipart/form-data", {
            status: /* Not Accepted */ 406,
            userMessage: true,
        });
    }

    try {
        return await request.formData();
    } catch (err) {
        throw new ServerError("Failed to decode form data", { status: 400 });
    }
}

export interface SendOptions {
    onError?: (error: unknown) => void;
    /**
     * Map non `ServerError`s  to `ServerError`s.
     */
    mapError?: (error: unknown) => ServerError;
}

/**
 * Catches `ServerError`s and sends them as JSON responses with the appropriate status code.
 * Non `ServerError`s are sent as a generic 500 error.
 */
export async function send(
    action: Promise<Response> | (() => Promise<Response>),
    options: SendOptions = {}
): Promise<Response> {
    try {
        if (typeof action === "function") action = action();
        return await action;
    } catch (err) {
        if (options.onError) options.onError(err);

        if (!(err instanceof ServerError) && options.mapError) {
            err = options.mapError(err);
        }

        if (err instanceof ServerError) {
            return new Response(JSON.stringify({ error: err.getUserMessage(), status: err.getStatus() }), {
                status: err.getStatus(),
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(JSON.stringify({ error: "Internal server error", status: 500 }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
