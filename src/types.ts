export type SearchParamValue = string | undefined | string[];

export interface PageProps {
    params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: SearchParamValue }>;
}

export interface LayoutProps {
    children?: React.ReactNode;
    params: Promise<{ [key: string]: string }>;
}
