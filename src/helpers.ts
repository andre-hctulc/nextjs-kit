import { NextRequest } from "next/server";
import { ServerError } from "./server-error";
import type { ErrorObject } from "./client";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

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

export interface SendLikeOptions {
    onError?: (error: unknown) => void;
    /**
     * Map non `ServerError`s  to `ServerError`s.
     */
    mapError?: (error: unknown) => ServerError | void | undefined | null;
}

/**
 * **Route Handler**
 *
 * Catches `ServerError`s and sends them as JSON responses with the appropriate status code.
 * Non `ServerError`s are sent as a generic 500 error.
 */
export async function send(
    sender: Response | Promise<Response> | (() => Response | Promise<Response>),
    options: SendLikeOptions = {}
): Promise<Response> {
    try {
        if (typeof sender === "function") sender = sender();
        return await sender;
    } catch (err) {
        // Throw next redirect errors. These errors are thrown by the next redirect function and should not be caught here
        if (isRedirectError(err)) throw err;

        if (options.mapError && !(err instanceof ServerError)) {
            const mappedErr = options.mapError(err);
            if (mappedErr != null) err = mappedErr;
        }

        if (options.onError) options.onError(err);

        if (err instanceof ServerError) {
            if (err.shouldRedirect()) {
                return redirect(err.getRedirect(), err.info.redirectType);
            }

            return new Response(JSON.stringify({ error: err.getUserMessage(), status: err.getStatus() }), {
                status: err.getStatus(),
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(JSON.stringify({ error: "Internal Server Error", status: 500 }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

/**
 * **Action**
 *
 * Catches `ServerError`s and sends them as JSON responses with the appropriate status code.
 * Non `ServerError`s are sent as a generic 500 error.
 */
export async function proc<T>(
    action: Promise<T> | (() => T | Promise<T>),
    options: SendLikeOptions = {}
): Promise<T | ErrorObject> {
    try {
        if (typeof action === "function") return await action();
        return await action;
    } catch (err) {
        // Throw next redirect errors. These errors are thrown by the next redirect function and should not be caught here
        if (isRedirectError(err)) throw err;

        if (options.mapError && !(err instanceof ServerError)) {
            const mappedErr = options.mapError(err);
            if (mappedErr != null) err = mappedErr;
        }

        if (options.onError) options.onError(err);

        if (err instanceof ServerError) {
            return { error: err.getUserMessage(), status: err.getStatus(), __isErrorObj: true } as any;
        }

        return { error: "Internal Server Error", status: 500, __isErrorObj: true } as any;
    }
}
