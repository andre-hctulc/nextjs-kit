import { ErrorObject, SuccessObject } from "./types.js";

export function paramValue<T>(value: T | T[] | undefined): T | undefined {
    if (Array.isArray(value)) {
        return value[0];
    } else {
        return value;
    }
}

export function paramValues<T>(value: T | T[] | undefined): T[] {
    if (Array.isArray(value)) {
        return value;
    } else if (value !== undefined) {
        return [value];
    } else {
        return [];
    }
}

export function isErrorObject(obj: any): obj is ErrorObject {
    return (
        obj && typeof obj.error === "string" && typeof obj.status === "number" && obj.__isErrorObj === true
    );
}

export function isSuccessObject<T>(obj: T): obj is Exclude<T, SuccessObject<T>> {
    return !isErrorObject(obj);
}
