"use client";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation.js";
import { useCallback } from "react";

type SearchInput = URLSearchParams | Record<string, string[] | undefined> | string;

interface UseMutableSearchParamsResult {
    searchParams: ReadonlyURLSearchParams;
    setSearchParams: (params: SearchInput, replace?: boolean) => void;
}

export function useMutableSearchParams(): UseMutableSearchParamsResult {
    const search = useSearchParams();
    const { push } = useRouter();

    const setSearchParams = useCallback(
        (params: SearchInput, replace = false) => {
            const newSearch = replace ? new URLSearchParams() : new URLSearchParams(search.toString());

            if (typeof params === "string") {
                newSearch.set("next", params);
            } else if (params instanceof URLSearchParams) {
                Array.from(params.entries()).forEach(([key, value]) => {
                    newSearch.append(key, value);
                });
            } else if (typeof params === "object") {
                Object.entries(params).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach((v) => newSearch.append(key, v));
                    } else if (value !== undefined) {
                        newSearch.set(key, value);
                    }
                });
            }

            push(`?${params.toString()}`);
        },
        [push, search]
    );

    return {
        searchParams: search,
        setSearchParams,
    };
}
