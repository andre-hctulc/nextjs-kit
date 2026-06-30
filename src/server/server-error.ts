export interface ServerErrorInfo {
    cause?: unknown;
    /** @default 500 */
    httpStatusCode?: number;
    /** Override the error message sent to the client */
    userMessage?: string;
    code?: string;
    /**
     * The URL to redirect to, when this error is thrown. Causes next's `redirect` to be called.
     */
    redirect?: string;
    /** Error details */
    details?: Record<string, unknown>;
}

export class ServerError extends Error {
    constructor(
        message: string,
        readonly info: ServerErrorInfo = {},
    ) {
        // @ts-ignore
        super(message, { cause: info.cause });
    }

    getUserMessage(): string {
        return this.info.userMessage ?? this.message;
    }

    getHttpStatusCode(): number {
        return this.info.httpStatusCode ?? 500;
    }

    shouldRedirect(): boolean {
        return !!this.info.redirect;
    }

    getDetails() {
        return { httpStatusCode: this.getHttpStatusCode(), ...this.info.details };
    }

    getRedirect(): string {
        return this.info.redirect || "";
    }

    getCode(): string {
        return this.info.code || this.getHttpStatusCode().toString();
    }
}
