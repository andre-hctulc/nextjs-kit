export interface ServerErrorInfo {
    cause?: unknown;
    status?: number;
    /**
     * If true, the message is interpreted as the user message
     */
    userMessage?: string | true;
    data?: any;
}

export class ServerError extends Error {
    constructor(message: string, readonly info: ServerErrorInfo = {}) {
        // @ts-ignore
        super(message, { cause: info.cause });
    }

    getUserMessage(): string {
        if (this.info.userMessage === true) return this.message;
        return this.info.userMessage ?? "Internal server error";
    }

    /**
     * The status code to be sent to the client. Defaults to 500.
     */
    getStatus(): number {
        return this.info.status ?? 500;
    }
}
