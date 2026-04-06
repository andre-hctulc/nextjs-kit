import { ReactNode } from "react";

export type ParamValue<T = string> = T | T[] | undefined;
export type RawParams<T = string> = Record<string, ParamValue<T>>;

type SearchParamValue = string | undefined | string[];

export interface PageProps {
    params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: SearchParamValue }>;
}

export interface ErrorPageProps extends PageProps {
    error: unknown;
}

export type LayoutProps = {
    children?: ReactNode;
    params: Promise<{ [key: string]: string }>;
};

export type LayoutPropsWithSlots = LayoutProps & Partial<{ [slot: string]: ReactNode }>;

export type ErrorObject = {
    error: unknown;
    success: false;
    data: undefined;
    details?: Record<string, any>;
    error_message?: string;
    [key: string]: unknown;
};

export type SuccessObject<T> = {
    error: null;
    success: true;
    data: T;
};
