export interface PageProps {
    params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface LayoutProps {
    children?: React.ReactNode;
    params: Promise<{ [key: string]: string }>;
}
