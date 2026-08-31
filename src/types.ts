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

export type ErrorPayload = {
    message: string;
    details?: any;
    code?: string;
    [key: string]: unknown;
};

export type ErrorObject<E = unknown> = {
    error: E;
    success: false;
    data: undefined;
};

export type SuccessObject<T = unknown> = {
    error: undefined;
    success: true;
    data: T;
};

// #### Action State ####
export interface ActionState<T = unknown> {
    errorMessage?: string;
    successMessage?: string;
    success?: boolean;
    errorCode?: string;
    details?: Record<string, unknown>;
    data?: T;
}

// #### Actions ####

export type ServerAction<TState = unknown> = (prevState: TState) => TState | Promise<TState>;

export type ServerActionWithPayload<TState = unknown, TInput = unknown> = (
    prevState: TState,
    input: TInput,
) => TState | Promise<TState>;

export type FormAction<TState = unknown> = ServerActionWithPayload<TState, FormData>;

// #### Data Parser ####

export type DataParser<T> = { parse: (formData: Record<string, unknown>) => T };
