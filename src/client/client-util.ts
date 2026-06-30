import { isRedirectError } from "next/dist/client/components/redirect-error.js";
import { ErrorObject, SuccessObject } from "../types.js";

/**
 * Run an action with error handling.
 */
export async function actSafely<T>(
    action: Promise<T> | (() => T | Promise<T>),
): Promise<SuccessObject<T> | ErrorObject> {
    try {
        let result: any;
        if (typeof action === "function") {
            result = await action();
        } else {
            result = await action;
        }
        return { data: result, error: undefined, success: true } satisfies SuccessObject<T>;
    } catch (error) {
        // Throw next redirect errors. These errors are thrown by the next redirect function and should not be caught here
        if (isRedirectError(error)) throw error;

        return { data: undefined, error, success: false } satisfies ErrorObject;
    }
}
