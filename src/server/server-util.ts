import { NextRequest, NextResponse } from "next/server.js";
import { ServerError } from "./server-error.js";
import { ErrorPayload } from "../types.js";
import { isRedirectError } from "next/dist/client/components/redirect-error.js";

/**
 * Parses the request body as JSON and throws a {@link ServerError} (406 Not Accepted) if the content type is not _application/json_.
 */
export async function parseJson<T = any>(request: NextRequest): Promise<T> {
    if (request.headers.get("Content-Type") !== "application/json") {
        throw new ServerError("Expected content type application/json", {
            httpStatusCode: /* Not Accepted */ 406,
        });
    }

    try {
        return await request.json();
    } catch (err) {
        throw new ServerError("Failed to decode JSON", { httpStatusCode: 400, cause: err });
    }
}

/**
 * Parses the request body as form data and throws a  {@link ServerError} (406 Not Accepted) if the content type is not _multipart/form-data_.
 */
export async function parseFormData(request: NextRequest): Promise<FormData> {
    if (!request.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
        throw new ServerError("Expected content type multipart/form-data", {
            httpStatusCode: /* Not Accepted */ 406,
        });
    }

    try {
        return await request.formData();
    } catch (err) {
        throw new ServerError("Failed to decode form data", { httpStatusCode: 400, cause: err });
    }
}

export type ErrorBoundary<E = unknown, R = any> = (error: E, data: any) => R | Promise<R>;

export function combineErrorBoundaries<E = unknown, R = any>(
    ...boundaries: ErrorBoundary<
        E,
        R | undefined | void | Promise<Awaited<R>> | Promise<undefined> | Promise<void>
    >[]
): ErrorBoundary<E, R> {
    return async (err: E, data: any) => {
        for (const boundary of boundaries) {
            const result = await boundary(err, data);
            if (result !== undefined) {
                return result;
            }
        }
        throw err;
    };
}

export interface SendOptions {
    data?: any;
    errorBoundary?: ErrorBoundary<unknown, Response>;
}

/**
 * Sends a response and handles errors.
 * {@link ServerError}s are handled and converted to a JSON response with the error message and details,
 * unless a custom error boundary is provided in the options.
 */
export async function send(
    fn: Response | Promise<Response> | (() => Response | Promise<Response>),
    options: SendOptions = {},
): Promise<Response> {
    try {
        if (typeof fn === "function") fn = fn();
        return await fn;
    } catch (err) {
        // Throw next redirect errors. These errors are thrown by the next redirect function and should not be caught here
        if (isRedirectError(err)) throw err;

        if (options.errorBoundary) {
            return options.errorBoundary(err, options.data);
        }

        if (err instanceof ServerError) {
            const status = err.getHttpStatusCode();

            if (err.shouldRedirect()) {
                return NextResponse.redirect(err.getRedirect());
            }

            return new Response(
                JSON.stringify({
                    error: {
                        message: err.getUserMessage(),
                        details: err.getDetails(),
                        code: err.getCode(),
                    } satisfies ErrorPayload,
                }),
                {
                    status,
                    headers: { "Content-Type": "application/json" },
                },
            );
        } else {
            return new Response(
                JSON.stringify({
                    error: {
                        message: "Internal Server Error",
                        details: {},
                        code: "INTERNAL_SERVER_ERROR",
                    } satisfies ErrorPayload,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
    }
}

export interface ActOptions<T = any> {
    data?: any;
    errorBoundary?: ErrorBoundary<unknown, T>;
}

/**
 * Run an action.
 * An error boundary can be provided to handle errors gracefully.
 */
export async function act<T>(
    action: Promise<T> | (() => T | Promise<T>),
    options: ActOptions<T> = {},
): Promise<T> {
    try {
        let result: any;
        if (typeof action === "function") {
            result = await action();
        } else {
            result = await action;
        }
        return result;
    } catch (err) {
        // Throw next redirect errors. These errors are thrown by the next redirect function and should not be caught here
        if (isRedirectError(err)) throw err;

        if (options.errorBoundary) {
            return options.errorBoundary(err, options.data) as any;
        }

        throw err;
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
