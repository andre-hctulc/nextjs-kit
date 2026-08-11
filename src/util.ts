import { ErrorPayload, DataParser, SuccessObject } from "./types.js";
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

interface ParseFormDataOptions<T extends object> {
    parser?: DataParser<T>;
    /**
     * If true, duplicate keys in the FormData will be stacked into an array. If false, the last value will overwrite previous values.
     * @default true
     */
    groupDuplicateKeys?: boolean;
}

export function parseFormData<T extends object = Record<string, any>>(
    fd: FormData | object,
    { parser, groupDuplicateKeys }: ParseFormDataOptions<T> = {},
): T {
    const obj: Record<string, any> = {};
    const entries = fd instanceof FormData ? fd.entries() : Object.entries(fd);
    for (const [key, value] of entries) {
        const currentValue: unknown = getProperty(obj, key);
        if (groupDuplicateKeys !== false && currentValue !== undefined) {
            if (Array.isArray(currentValue)) {
                currentValue.push(value);
            } else {
                setProperty(obj, key, [currentValue, value]);
            }
        } else {
            setProperty(obj, key, value);
        }
    }
    if (parser) {
        return parser.parse(obj);
    }
    return obj as T;
}
