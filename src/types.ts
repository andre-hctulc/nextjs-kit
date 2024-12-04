export interface PageProps {
    params: Promise<any>;
    searchParams: Promise<any>;
}

export interface LayoutProps {
    children?: React.ReactNode;
    params: Promise<any>;
}
