import { ErrorObject, ErrorPayload, DataParser, SuccessObject } from "./types.js";
import { getProperty, setProperty } from "dot-prop";

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

export function isErrorObject(obj: any): obj is ErrorPayload {
    return (
        obj && typeof obj.error === "string" && typeof obj.status === "number" && obj.__isErrorObj === true
    );
}

export function isSuccessObject<T>(obj: T): obj is Exclude<T, SuccessObject<T>> {
    return !isErrorObject(obj);
}

export function parseFormData<T extends object = Record<string, any>>(
    fd: FormData,
    parser?: DataParser<T>,
): T {
    const obj: Record<string, any> = {};
    for (const [key, value] of fd.entries()) {
        setProperty(obj, key, value);
    }
    if (parser) {
        return parser.parse(obj);
    }
    return obj as T;
}