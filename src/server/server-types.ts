export interface CommonErrorBody {
    code: string | number;
    details: any;
    error: string;
}

export type RouteContext = {
    params: Record<string, string>;
};
