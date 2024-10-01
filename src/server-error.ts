export interface ServerErrorInfo {
    cause?: unknown;
    status?: number;
    /**
     * If true, the message is interpreted as the user message.
     * By default the user message is inferred from the status code.
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
        return this.info.userMessage || getDefaultErrorMessage(this.getStatus());
    }

    /**
     * The status code to be sent to the client. Defaults to 500.
     */
    getStatus(): number {
        return this.info.status ?? 500;
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
