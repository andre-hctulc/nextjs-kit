import { NextResponse } from "next/server.js";

/** 
 * Extends the {@link NextResponse} 
 * */
export class KitResponse extends NextResponse {
    /**
     * Sends a response with the give status
     * @param status
     * @param statusText Status message
     * @param init `ResponseInit`
     * */
    static sendStatus(status: number, statusText: string, init?: ResponseInit & { body?: BodyInit }) {
        return new KitResponse(init?.body, {
            status: status,
            statusText: statusText,
            ...init,
        });
    }

    /**
     * Sends _any_ value.
     * @param value
     * @param init `ResponseInit`
     * */
    static send<T = any>(value: T, init?: ResponseInit) {
        if (value === null || value === undefined) return new Response(undefined, { status: 200, ...init });
        else if (value instanceof ReadableStream) return KitResponse.stream(value, init);
        else if (Buffer.isBuffer(value)) return KitResponse.blob(value, init);
        else return KitResponse.json(value, { status: 200, ...init });
    }

    /**
     * Sends a _Blob_.
     * @param value `Buffer`
     * @param init `ResponseInit`
     * */
    static blob(value: Buffer, init?: ResponseInit) {
        const headers = new Headers(init?.headers || {});
        headers.set("content-type", "application/octet-stream");
        return new Response(value, { status: 200, ...init, headers });
    }

    /**
     * Sends a _Stream_.
     * @param value `ReadableStream`
     * @param init `ResponseInit`
     * */
    static stream(value: ReadableStream, init?: ResponseInit) {
        return new Response(value, { status: 200, ...init });
    }
}
