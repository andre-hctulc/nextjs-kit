export type ErrorObject = {
    error: true;
    errorMessage: string;
    status: number;
    details: Record<string, any>;
    success: false;
    data: null;
};

export type SuccessObject<T> = {
    error: null;
    success: true;
    data: T;
};

export function isErrorObject(obj: any): obj is ErrorObject {
    return (
        obj && typeof obj.error === "string" && typeof obj.status === "number" && obj.__isErrorObj === true
    );
}

export function isSuccessObject<T>(obj: T): obj is Exclude<T, ErrorObject> {
    return !isErrorObject(obj);
}
