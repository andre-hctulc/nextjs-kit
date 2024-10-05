import React from "react";
import { ErrorObject, isErrorObject } from "./client";

export type UserServerActionResult<A extends ServerAction, E = unknown> = {
    data: Awaited<ReturnType<A>> | undefined;
    error: E | null;
    isPending: boolean;
    action: (...args: Parameters<A>) => Promise<void>;
    errorObject: ErrorObject | null;
    isSuccess: boolean;
};

type ServerAction = (...args: any) => any;

export function useServerAction<A extends ServerAction, E = unknown>(
    action: A
): UserServerActionResult<A, E> {
    const [isPending, startTransition] = React.useTransition();
    const [data, setData] = React.useState<Awaited<ReturnType<A>> | undefined>(undefined);
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
                let result: Awaited<ReturnType<A>> | undefined;
                try {
                    result = await action(...args);

                    if (currentAbortController.signal.aborted) return;

                    // Check if the result is an error object produced by `proc`
                    // If it is, set the error object and throw an error to propagate to error boundary
                    if (isErrorObject(result)) {
                        setErrorObject(result);
                        throw new Error(result.message);
                    }

                    setData(result);
                    setIsSuccess(true);
                    setError(null);
                    setErrorObject(null);
                } catch (err) {
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
