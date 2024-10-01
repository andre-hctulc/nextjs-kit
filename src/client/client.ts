export type ErrorObject = { error: string; status: number };

export function isErrorObject(obj: any): obj is ErrorObject {
    return (
        obj && typeof obj.error === "string" && typeof obj.status === "number" && obj.__isErrorObj === true
    );
}

export function isSuccessObject<T>(obj: T): obj is Exclude<T, ErrorObject> {
    return !isErrorObject(obj);
}
