import { setProperty, getProperty } from "dot-prop";

export type FormDataKeyFormat = "dot-prop" | "bracket-notation" | "flat";

export interface ParseFormDataOptions {
    keyFormat?: FormDataKeyFormat;
}

export interface ParseFormDataResult<T extends object = Record<string, any>> {
    parsedFormData: T;
    formData: FormData;
}

export function parseFormData<T extends object = Record<string, any>>(
    form: HTMLFormElement | FormData,
    { keyFormat }: ParseFormDataOptions = {},
): ParseFormDataResult<T> {
    const parsedData: Record<string, any> = {};

    const appendParsedValue = (key: string, value: FormDataEntryValue) => {
        if (keyFormat === "bracket-notation") {
            throw new Error("Bracket notation parsing is not implemented yet.");
        }

        if (keyFormat === "dot-prop") {
            const current: any = getProperty(parsedData, key);
            if (current === undefined) {
                setProperty(parsedData, key, value);
                return;
            }

            if (Array.isArray(current)) {
                current.push(value);
                return;
            }

            setProperty(parsedData, key, [current, value]);
            return;
        }

        const current = parsedData[key];
        if (current === undefined) {
            parsedData[key] = value;
            return;
        }

        if (Array.isArray(current)) {
            current.push(value);
            return;
        }

        parsedData[key] = [current, value];
    };

    if (form instanceof FormData) {
        for (const [key, value] of form.entries()) {
            appendParsedValue(key, value);
        }

        return {
            parsedFormData: parsedData as T,
            formData: form,
        };
    }

    const formData = new FormData(form);

    for (const field of Array.from(form.elements)) {
        const name = field.getAttribute("name");
        if (!name) {
            continue;
        }

        if (field instanceof HTMLInputElement) {
            if (field.type === "checkbox" || field.type === "radio") {
                if (!field.checked) {
                    continue;
                }
                appendParsedValue(name, field.value ?? "on");
                continue;
            }

            if (field.type === "submit" || field.type === "button" || field.type === "reset") {
                continue;
            }

            appendParsedValue(name, field.value);
            continue;
        }

        if (field instanceof HTMLSelectElement) {
            if (field.multiple) {
                const selectedValues = Array.from(field.selectedOptions).map((option) => option.value);
                if (selectedValues.length === 0) {
                    continue;
                }
                for (const value of selectedValues) {
                    appendParsedValue(name, value);
                }
                continue;
            }

            appendParsedValue(name, field.value);
            continue;
        }

        if (field instanceof HTMLTextAreaElement) {
            appendParsedValue(name, field.value);
        }
    }

    return {
        parsedFormData: parsedData as T,
        formData,
    };
}

export interface FormDataFromObjectOptions {}

export function formDataFromObject(data: Record<string, any>, {}: FormDataFromObjectOptions = {}): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        if (value == null) {
            continue;
        }
        if (Array.isArray(value)) {
            value.forEach((entry) => formData.append(key, String(entry)));
            continue;
        }
        formData.append(key, String(value));
    }
    return formData;
}
