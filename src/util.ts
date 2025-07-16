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