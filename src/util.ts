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

export type SearchInput =
    | URLSearchParams
    | Record<string, string | (string | number | boolean)[] | undefined | number | boolean>
    | string;

export function normalizeSearch(searchInput: SearchInput): URLSearchParams {
    if (typeof searchInput === "string") {
        return new URLSearchParams(searchInput);
    } else if (searchInput instanceof URLSearchParams) {
        return new URLSearchParams(searchInput);
    } else if (typeof searchInput === "object" && searchInput !== null) {
        const params = new URLSearchParams();
        Object.entries(searchInput).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, String(v)));
            } else if (value != undefined) {
                params.set(key, String(value));
            }
        });
        return params;
    }
    return new URLSearchParams();
}
