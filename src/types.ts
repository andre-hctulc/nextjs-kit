import { ReactNode } from "react";

export type ParamValue<T = string> = T | T[] | undefined;
export type RawParams<T = string> = Record<string, ParamValue<T>>;

type SearchParamValue = string | undefined | string[];

export interface PageProps {
    params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: SearchParamValue }>;
}

export type LayoutProps = {
    children?: ReactNode;
    params: Promise<{ [key: string]: string }>;
} & { [slot: string]: ReactNode };
