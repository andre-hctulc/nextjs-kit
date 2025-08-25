"use client";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation.js";
import { useCallback } from "react";
import { normalizeSearch, SearchInput } from "../system.js";

type ParamValue = string | boolean | number | (string | boolean | number)[];

interface UseMutableSearchParamsResult {
    searchParams: ReadonlyURLSearchParams;
    setSearchParams: (params: SearchInput, options?: SetParamOptions) => void;
    setSearchParam: (key: string, value: ParamValue, options?: SetParamOptions) => void;
    setSearchParamsUrl: (params: SearchInput, options?: SetParamOptions) => string;
    setSearchParamUrl: (key: string, value: ParamValue, options?: SetParamOptions) => string;
    deleteSearchParamUrl: (key: string) => string;
    deleteSearchParam: (key: string, options?: Pick<SetParamOptions, "replace">) => void;
    deleteSearchParamsUrl: (keys: string[]) => string;
    deleteSearchParams: (keys: string[], options?: Pick<SetParamOptions, "replace">) => void;
}

interface SetParamOptions {
    /**
     * Replace the current history entry instead of pushing a new one.
     */
    replace?: boolean;
    /**
     * Append search param instead of overwriting existing ones.
     */
    append?: boolean;
    /**
     * Overwrite all existing params instead of merging them
     */
    overwrite?: boolean;
}

export function useMutableSearchParams(): UseMutableSearchParamsResult {
    const search = useSearchParams();
    const { push, replace } = useRouter();

    const setSearchParamsUrl = useCallback(
        (params: SearchInput, options?: SetParamOptions) => {
            const normalizedInput = normalizeSearch(params);
            const newSearch = new URLSearchParams();

            if (!options?.overwrite) {
                const oldSearch = new URLSearchParams(search.toString());

                oldSearch.forEach((value, key) => {
                    if (!options?.append && normalizedInput.has(key)) {
                        return;
                    }
                    newSearch.append(key, value);
                });
            }

            normalizedInput.forEach((value, key) => {
                newSearch.append(key, value);
            });

            return `?${newSearch.toString()}`;
        },
        [search]
    );

    const setSearchParams = useCallback(
        (params: SearchInput, options?: SetParamOptions) => {
            const url = setSearchParamsUrl(params, options);
            if (options?.replace) {
                push(url);
            } else {
                replace(url);
            }
        },
        [push, replace, setSearchParamsUrl]
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
        (key: string, options?: SetParamOptions) => {
            const url = deleteSearchParamUrl(key);
            if (options?.replace) {
                replace(url);
            } else {
                push(url);
            }
        },
        [push, deleteSearchParamUrl]
    );

    const deleteSearchParamsUrl = useCallback(
        (keys: string[]) => {
            const newSearch = new URLSearchParams(search.toString());
            keys.forEach((key) => newSearch.delete(key));
            return `?${newSearch.toString()}`;
        },
        [search]
    );

    const deleteSearchParams = useCallback(
        (keys: string[], options?: Pick<SetParamOptions, "replace">) => {
            const url = deleteSearchParamsUrl(keys);
            if (options?.replace) {
                replace(url);
            } else {
                push(url);
            }
        },
        [push, deleteSearchParamsUrl]
    );

    return {
        searchParams: search,
        setSearchParams,
        setSearchParam,
        deleteSearchParam,
        setSearchParamsUrl,
        setSearchParamUrl,
        deleteSearchParamUrl,
        deleteSearchParamsUrl,
        deleteSearchParams,
    };
}
