import { ParamsPromise } from "../shared/shared.types.js";

export interface CommonErrorBody {
    code: string | number;
    data: any;
    error: string;
}

export type RouteContext = {
    params: ParamsPromise;
};
