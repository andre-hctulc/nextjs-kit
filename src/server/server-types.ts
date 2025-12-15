export interface CommonErrorBody {
    code: string | number;
    data: any;
    error: string;
}

export type RouteContext = {
    params: Promise<{ [K in string]: string | string[] }>;
};
