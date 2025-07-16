"use client";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation.js";
import { useCallback } from "react";
import { normalizeSearch, SearchInput } from "../system.js";

type ParamValue = string | boolean | number | (string | boolean | number)[];

interface UseMutableSearchParamsResult {
    searchParams: ReadonlyURLSearchParams;
    setSearchParams: (params: SearchInput, options?: SetParamOptions) => void;
    setSearchParam: (key: string, value: ParamValue, options?: SetParamOptions) => void;
    deleteSearchParam: (key: string) => void;
    setSearchParamsUrl: (params: SearchInput, options?: SetParamOptions) => string;
    setSearchParamUrl: (key: string, value: ParamValue, options?: SetParamOptions) => string;
    deleteSearchParamUrl: (key: string) => string;
}

interface SetParamOptions {
    replace?: boolean;
    append?: boolean;
}

export function useMutableSearchParams(): UseMutableSearchParamsResult {
    const search = useSearchParams();
    const { push } = useRouter();

    const setSearchParamsUrl = useCallback(
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
            return `?${newSearch.toString()}`;
        },
        [search]
    );

    const setSearchParams = useCallback(
        (params: SearchInput, options?: SetParamOptions) => {
            const url = setSearchParamsUrl(params, options);
            push(url);
        },
        [push, setSearchParamsUrl]
    );

    const setSearchParamUrl = useCallback(
        (key: string, value: ParamValue, options?: SetParamOptions) => {
            return setSearchParamsUrl({ [key]: value }, options);
        },
        [setSearchParamsUrl]
    );

    const setSearchParam = useCallback(
        (key: string, value: ParamValue, options?: SetParamOptions) => {
            setSearchParams({ [key]: value }, options);
        },
        [setSearchParams]
    );

    const deleteSearchParamUrl = useCallback(
        (key: string) => {
            const newSearch = new URLSearchParams(search.toString());
            newSearch.delete(key);
            return `?${newSearch.toString()}`;
        },
        [search]
    );

    const deleteSearchParam = useCallback(
        (key: string) => {
            const url = deleteSearchParamUrl(key);
            push(url);
        },
        [push, deleteSearchParamUrl]
    );

    return {
        searchParams: search,
        setSearchParams,
        setSearchParam,
        deleteSearchParam,
        setSearchParamsUrl,
        setSearchParamUrl,
        deleteSearchParamUrl,
    };
}
