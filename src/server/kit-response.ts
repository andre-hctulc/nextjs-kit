import { NextResponse } from "next/server.js";
import { CommonErrorBody } from "./server-types.js";

/**
 * Extends the {@link NextResponse}
 * */
export class KitResponse extends NextResponse {
    /**
     * Sends a response with the given status
     * @param status
     * @param body Response body
     * @param init `ResponseInit`
     * */
    static sendStatus(status: number, body: any, init?: ResponseInit) {
        return  KitResponse.send(body, {
            status: status,
            ...init,
        });
    }

    /**
     * Sends an error with the given status
     * @param status
     * @param body Common error body
     * @param init `ResponseInit`
     * */
    static sendError(status: number, body: CommonErrorBody, init?: ResponseInit) {
        return new KitResponse(JSON.stringify(body), {
            status: status,
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
        return new Response(new Blob([value.buffer as ArrayBuffer]), { status: 200, ...init, headers });
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
