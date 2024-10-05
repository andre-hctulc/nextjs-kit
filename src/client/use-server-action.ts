import React from "react";
import { ErrorObject, isErrorObject } from "./client";

/**
 * The return type of a server action, **excluding** error objects.
 */
export type ActionResponse<A extends ServerAction> = Exclude<Awaited<ReturnType<A>>, ErrorObject>;

export type UserServerActionResult<A extends ServerAction, E = unknown> = {
    data: ActionResponse<A> | undefined;
    error: E | null;
    isPending: boolean;
    action: (...args: Parameters<A>) => Promise<void>;
    errorObject: ErrorObject | null;
    isSuccess: boolean;
};

type ServerAction = (...args: any) => any;

export type UseServerActionOptions<A extends ServerAction, E = unknown> = {
    onSuccess?: (data: ActionResponse<A>) => void;
    onError?: (error: E, errorObject: ErrorObject | null) => void;
};

/**
 * Leverages React's `useTransition` to provide a hook that handles server actions.
 * Errors (including `ErrorObject`s produced by `proc`) are caught and provided in the result.
 */
export function useServerAction<A extends ServerAction, E = unknown>(
    action: A,
    options?: UseServerActionOptions<A, E>
): UserServerActionResult<A, E> {
    const [isPending, startTransition] = React.useTransition();
    const [data, setData] = React.useState<ActionResponse<A> | undefined>(undefined);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [error, setError] = React.useState<E | null>(null);
    const [errorObject, setErrorObject] = React.useState<ErrorObject | null>(null);
    const abortController = React.useRef<AbortController | null>(null);

    const act = React.useCallback(
        async (...args: Parameters<A>) => {
            if (abortController.current) {
                abortController.current.abort();
            }

            const currentAbortController = (abortController.current = new AbortController());

            setData(undefined);
            setIsSuccess(false);
            setError(null);
            setErrorObject(null);

            startTransition(async () => {
                try {
                    const result = await action(...args);
                    const isErrObj = isErrorObject(result);

                    if (!isErrObj && options?.onSuccess) options.onSuccess(result);

                    if (currentAbortController.signal.aborted) return;

                    // Check if the result is an error object produced by `proc`
                    // If it is, set the error object and throw an error to propagate to error boundary
                    if (isErrObj) {
                        setErrorObject(result);
                        const err: any = new Error(result.error);
                        err.__errorObject = result;
                        throw err;
                    }

                    setData(result);
                    setIsSuccess(true);
                    setError(null);
                    setErrorObject(null);
                } catch (err) {
                    if (options?.onError) options.onError(err as E, (err as any)?.__errorObject || null);

                    if (currentAbortController.signal.aborted) return;
                    setError(err as E);
                    setData(undefined);
                    setIsSuccess(false);
                }
            });
        },
        [startTransition]
    );

    // Cleanup
    React.useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    return { isPending, action: act, error, errorObject, data, isSuccess };
}
