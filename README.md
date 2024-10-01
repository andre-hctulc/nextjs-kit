# nextjs-kit

Some [Next.JS](https://nextjs.org) utils.

## Basic Usage

```ts
import { send } from "nextjs-kit";

export function GET() {
    return send(async () => {
        const list = await getList();
        return Response.json(list);
    });
}
```

```ts
import { send, parseJSON } from "nextjs-kit";

export function POST(request: NextRequest) {
    return send(async () => {
        const data = await parseJSON(request);
        const newItem = await create(data);
        return Response.json(newItem.id);
    });
}
```

## Helpers

-   `send`
-   `parseJSON`
-   `parseFormData`

## Error Handling

Send catches all errors and maps `ServerError`s to appropriate responses. Other errors are mapped to a generic _500_ response.

```ts
import { ServerError } from "nextjs-kit";

if (typeof data.id !== "string") {
    // By default the user message is empty.
    // To interpret the error message as the user message set `userMessage: true`.
    // When `userMessage` is not provided the error message is derived from the status.
    throw new ServerError("ID is not a string. Got " + typeof data.id, {
        status: 400,
        userMessage: "Invalid ID",
    });
}
```
