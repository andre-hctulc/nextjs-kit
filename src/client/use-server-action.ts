"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error.js";
import { ErrorObject, SuccessObject } from "../types.js";

type ServerAction = (...args: any) => Promise<any>;
type ServerActionResult<T> = T extends ServerAction ? ReturnType<T> : never;
type ServerActionParameters<T> = T extends (...args: infer P) => any ? P : never;

export type UserServerActionResult<S extends ServerAction> = {
    data: ServerActionResult<S> | undefined;
    error: unknown | null;
    isPending: boolean;
    action: (
        ...args: ServerActionParameters<S>
    ) => Promise<SuccessObject<ServerActionResult<S>> | ErrorObject>;
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

    const act = useCallback(
        async (...args: Parameters<S>): Promise<SuccessObject<ServerActionResult<S>> | ErrorObject> => {
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

                if (options?.onSuccess) {
                    options.onSuccess(result);
                }

                if (!currentAbortController.signal.aborted) {
                    setData(result);
                    setIsSuccess(true);
                    setError(null);
                    setErrorObject(null);
                    setIsPending(false);
                }

                return {
                    success: true,
                    data: result,
                    error: null,
                };
            } catch (err) {
                if (isRedirectError(err)) {
                    throw err;
                }
                if (!currentAbortController.signal.aborted) {
                    setError(err);
                    setData(undefined);
                    setIsSuccess(false);
                    setIsPending(false);
                }

                if (options?.onError) options.onError((err as any)?.__errorObject || null, err);
                
                return {
                    success: false,
                    error: err,
                    data: undefined,
                };
            } finally {
            }
        },
        []
    );

    return { isPending, action: act, error, errorObject, data, isSuccess };
}
