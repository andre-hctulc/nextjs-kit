"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorObject, isErrorObject } from "./client-util.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";

type ServerAction = (...args: any) => Promise<any>;
type ServerActionResult<T> = T extends ServerAction ? ReturnType<T> : never;
type ServerActionParameters<T> = T extends (...args: infer P) => any ? P : never;

export type UserServerActionResult<S extends ServerAction> = {
    data: ServerActionResult<S> | undefined;
    error: unknown | null;
    isPending: boolean;
    action: (...args: ServerActionParameters<S>) => Promise<void>;
    errorObject: ErrorObject | null;
    isSuccess: boolean;
};

export type UseServerActionOptions<T, E = unknown> = {
    onSuccess?: (data: T) => void;
    onError?: (errorObject: ErrorObject | null, error: unknown) => void;
};

/**
 * Errors (including  {@link ErrorObject}s produced by  {@link act} are caught and provided in the result.
 */
export function useServerAction<S extends ServerAction>(
    action: S,
    options?: UseServerActionOptions<ServerActionResult<S>>
): UserServerActionResult<S> {
    const [isPending, setIsPending] = useState(false);
    const [data, setData] = useState<ServerActionResult<S> | undefined>(undefined);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [errorObject, setErrorObject] = useState<ErrorObject | null>(null);
    const abortController = useRef<AbortController | null>(null);
    const a = useRef(action);

    useEffect(() => {
        a.current = action;
    }, [action]);

    const act = useCallback(async (...args: Parameters<S>) => {
        if (abortController.current) {
            abortController.current.abort();
        }

        const currentAbortController = (abortController.current = new AbortController());

        setData(undefined);
        setIsSuccess(false);
        setError(null);
        setErrorObject(null);
        setIsPending(true);

        try {
            const result = await a.current(...args);
            const isErrObj = isErrorObject(result);

            if (currentAbortController.signal.aborted) return;

            if (!isErrObj && options?.onSuccess) {
                options.onSuccess(result);
            }

            // Check if the result is an error object produced by `proc`
            // If it is, set the error object and throw an error to propagate to error boundary
            if (isErrObj) {
                setErrorObject(result);
                const err: any = new Error(result.errorMessage);
                err.__errorObject = result;
                throw err;
            }

            setData(result);
            setIsSuccess(true);
            setError(null);
            setErrorObject(null);
        } catch (err) {
            if (isRedirectError(err)) {
                throw err;
            }
            if (currentAbortController.signal.aborted) return;

            if (options?.onError) options.onError((err as any)?.__errorObject || null, err);
            setError(err);
            setData(undefined);
            setIsSuccess(false);
        } finally {
            setIsPending(false);
        }
    }, []);

    return { isPending, action: act, error, errorObject, data, isSuccess };
}
