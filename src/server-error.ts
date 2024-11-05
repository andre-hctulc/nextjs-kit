import type { RedirectType } from "next/navigation";

export interface ServerErrorInfo {
    cause?: unknown;
    /**
     * @default 500
     */
    status?: number;
    /**
     * **⚠️** This message is sent to the client!
     *
     * If true, the message is interpreted as the user message.
     * By default the user message is inferred from the status code.
     */
    userMessage?: string | true;
    data?: any;
    /**
     * The URL to redirect to, when this error is thrown. Causes next's `redirect` to be called.
     */
    redirect?: string;
    redirectType?: RedirectType;
    /** 
     * **⚠️** Tags are are sent to the client! 
     * */
    tags?: string[];
}

export class ServerError extends Error {
    constructor(message: string, readonly info: ServerErrorInfo = {}) {
        // @ts-ignore
        super(message, { cause: info.cause });
    }

    getUserMessage(): string {
        if (this.info.userMessage === true) return this.message;
        return this.info.userMessage || getDefaultErrorMessage(this.getStatus());
    }

    /**
     * The status code to be sent to the client. Defaults to 500.
     */
    getStatus(): number {
        return this.info.status ?? 500;
    }

    shouldRedirect(): boolean {
        return !!this.info.redirect;
    }

    getTags(): string[] {
        return this.info.tags || [];
    }

    /**
     * @returns The URL to redirect to, or an empty string if no redirect is specified.
     */
    getRedirect(): string {
        return this.info.redirect || "";
    }

    static is(e: unknown, status?: number): e is ServerError {
        return e instanceof ServerError && (status === undefined || e.getStatus() === status);
    }
}

function getDefaultErrorMessage(status: number) {
    switch (status) {
        case 400:
            return "Bad Request";
        case 401:
            return "Unauthorized";
        case 403:
            return "Forbidden";
        case 404:
            return "Not Found";
        case 406:
            return "Not Acceptable";
        case 409:
            return "Conflict";
        case 422:
            return "Unprocessable Entity";
        case 429:
            return "Too Many Requests";
        case 451:
            return "Unavailable For Legal Reasons";
        case 500:
            return "Internal Server Error";
        case 501:
            return "Not Implemented";
        default:
            return "Error";
    }
}
