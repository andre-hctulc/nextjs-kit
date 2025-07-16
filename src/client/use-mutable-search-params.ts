"use client";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation.js";
import { useCallback } from "react";
import { normalizeSearch, SearchInput } from "../util.js";

type ParamValue = string | boolean | number | (string | boolean | number)[];

interface UseMutableSearchParamsResult {
    searchParams: ReadonlyURLSearchParams;
    setSearchParams: (params: SearchInput, options?: SetParamOptions) => void;
    setSearchParam: (key: string, value: ParamValue, options?: SetParamOptions) => void;
    deleteSearchParam: (key: string) => void;
}

interface SetParamOptions {
    replace?: boolean;
    append?: boolean;
}

export function useMutableSearchParams(): UseMutableSearchParamsResult {
    const search = useSearchParams();
    const { push } = useRouter();

    const setSearchParams = useCallback(
        (params: SearchInput, options?: SetParamOptions) => {
            const newSearch = normalizeSearch(params);

            if (!options?.replace) {
                const oldParams = new URLSearchParams(search.toString());
                oldParams.forEach((value, key) => {
                    if (!options?.append && newSearch.has(key)) {
                        return;
                    }
                    newSearch.append(key, value);
                });
            }

            push(`?${params.toString()}`);
        },
        [push, search]
    );

    const setSearchParam = useCallback(
        (key: string, value: ParamValue, options?: SetParamOptions) => {
            setSearchParams({ [key]: value }, options);
        },
        [setSearchParams]
    );

    const deleteSearchParam = useCallback(
        (key: string) => {
            const newSearch = new URLSearchParams(search.toString());
            newSearch.delete(key);
            push(`?${newSearch.toString()}`);
        },
        [push, search]
    );

    return {
        searchParams: search,
        setSearchParams,
        setSearchParam,
        deleteSearchParam,
    };
}
