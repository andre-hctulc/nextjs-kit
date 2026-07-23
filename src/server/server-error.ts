export interface ServerErrorOptions {
    cause?: unknown;
    /** @default 500 */
    statusCode?: number;
    /** Override the error message sent to the client */
    userMessage?: string;
    errorCode?: string;
    /**
     * The URL to redirect to, when this error is thrown. Causes next's `redirect` to be called.
     */
    redirect?: string;
    /** Error details */
    details?: Record<string, unknown>;
}

export class ServerError extends Error {
    #options: ServerErrorOptions;

    readonly details: Record<string, unknown>;
    readonly errorCode: string;
    readonly statusCode: number;

    constructor(message: string, options: ServerErrorOptions = {}) {
        // @ts-ignore
        super(message, { cause: options.cause });
        this.#options = options;
        this.details = options.details ?? {};
        this.errorCode = options.errorCode ?? "INTERNAL_SERVER_ERROR";
        this.statusCode = options.statusCode ?? 500;
    }

    getUserMessage(): string {
        return this.#options.userMessage ?? this.message;
    }

    shouldRedirect(): boolean {
        return !!this.#options.redirect;
    }

    getRedirect(): string {
        return this.#options.redirect || "";
    }
}
