import { NextRequest } from "next/server.js";
import { ServerError } from "./server-error.js";
import type { ErrorObject } from "./client/index.js";
import { redirect } from "next/navigation.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";

/**
 * Parses the request body as JSON and throws a `ServerError` (406 Not Accepted) if the content type is not `application/json`.
 */
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

/**
 * Parses the request body as form data and throws a `ServerError` (406 Not Accepted) if the content type is not `multipart/form-data`.
 */
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
        throw new ServerError("Failed to decode form data", { status: 400, cause: err });
    }
}

export interface SendLikeOptions {
    onError?: (error: unknown) => void;
    /**
     * Map non `ServerError`s  to `ServerError`s.
     */
    mapError?: (error: unknown) => ServerError | void | undefined | null;
    /**
     * @default "all"
     */
    errorLogs?: "5xx" | "all" | "disabled";
}

const logError = (err: unknown) => {
    if (err instanceof ServerError) {
        const marker = `** Server Error (${err.getStatus()}) **\n`;
        console.error(marker, err);
    } else {
        const marker = "** ? Error **\n";
        console.error(marker, err);
    }
};

/**
 * **Route Handler**
 *
 * Catches `ServerError`s and sends them as JSON responses with the appropriate status code.
 * Non `ServerError`s are sent as a generic 500 error.
 *
 * Do **not** use this in middleware
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

        const logAll = !options.errorLogs || options.errorLogs === "all";

        if (err instanceof ServerError) {
            const status = err.getStatus();

            // Log server errors
            if (logAll || (options.errorLogs === "5xx" && status >= 500)) {
                logError(err);
            }

            if (err.shouldRedirect()) {
                return redirect(err.getRedirect(), err.info.redirectType);
            }

            return new Response(
                JSON.stringify({ error: err.getUserMessage(), status, tags: err.getTags() }),
                {
                    status,
                    headers: { "Content-Type": "application/json" },
                }
            );
        } else {
            // Log unknown errors
            if (logAll || options.errorLogs === "5xx") {
                logError(err);
            }
        }

        return new Response(JSON.stringify({ error: "Internal Server Error", status: 500, tags: [] }), {
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
 *
 * @returns The result of the action or an error object. Check if the result is an error object with `isErrorObject`
 */
export async function act<T>(
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

        if (options.errorLogs !== "disabled") logError(err);

        // Server error
        if (err instanceof ServerError) {
            return {
                error: err.getUserMessage(),
                status: err.getStatus(),
                tags: err.getTags(),
                __isErrorObj: true,
            } as any;
        }

        // Unknown error
        return { error: "Internal Server Error", status: 500, tags: [], __isErrorObj: true } as any;
    }
}

/**
 * @param key Unique key for the value.
 */
export function initOnce<T>(key: string, value: () => T): T {
    const glob: any = typeof window === "undefined" ? global : window;
    key = "@initOnce:" + key;
    if (key in glob) return glob[key];
    return (glob[key] = value());
}

/**
 * @param key Unique key for the action.
 */
export function doOnce<T>(key: string, action: () => T) {
    const glob: any = typeof window === "undefined" ? global : window;
    key = "@doOnce:" + key;
    if (key in glob) return;
    glob[key] = "done";
    action();
}

export enum HttpStatus {
    // 1xx Informational
    CONTINUE = 100,
    SWITCHING_PROTOCOLS = 101,
    PROCESSING = 102,
    // 2xx Success
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NON_AUTHORITATIVE_INFORMATION = 203,
    NO_CONTENT = 204,
    RESET_CONTENT = 205,
    PARTIAL_CONTENT = 206,
    MULTI_STATUS = 207,
    ALREADY_REPORTED = 208,
    IM_USED = 226,
    // 3xx Redirection
    MULTIPLE_CHOICES = 300,
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    SEE_OTHER = 303,
    NOT_MODIFIED = 304,
    USE_PROXY = 305,
    SWITCH_PROXY = 306,
    TEMPORARY_REDIRECT = 307,
    PERMANENT_REDIRECT = 308,
    // 4xx Client Errors
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    PAYMENT_REQUIRED = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    PROXY_AUTHENTICATION_REQUIRED = 407,
    REQUEST_TIMEOUT = 408,
    CONFLICT = 409,
    GONE = 410,
    LENGTH_REQUIRED = 411,
    PRECONDITION_FAILED = 412,
    PAYLOAD_TOO_LARGE = 413,
    URI_TOO_LONG = 414,
    UNSUPPORTED_MEDIA_TYPE = 415,
    RANGE_NOT_SATISFIABLE = 416,
    EXPECTATION_FAILED = 417,
    IM_A_TEAPOT = 418,
    MISDIRECTED_REQUEST = 421,
    UNPROCESSABLE_ENTITY = 422,
    LOCKED = 423,
    FAILED_DEPENDENCY = 424,
    TOO_EARLY = 425,
    UPGRADE_REQUIRED = 426,
    PRECONDITION_REQUIRED = 428,
    TOO_MANY_REQUESTS = 429,
    REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
    UNAVAILABLE_FOR_LEGAL_REASONS = 451,
    // 5xx Server Errors
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504,
    HTTP_VERSION_NOT_SUPPORTED = 505,
    VARIANT_ALSO_NEGOTIATES = 506,
    INSUFFICIENT_STORAGE = 507,
    LOOP_DETECTED = 508,
    NOT_EXTENDED = 510,
    NETWORK_AUTHENTICATION_REQUIRED = 511,
}
