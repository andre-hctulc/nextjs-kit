# nextjs-kit

## Basic

```ts
import { send } from "nextjs-kit";

export function GET() {
    return send(() => {
        const list = await getList();
        return Response.json(list);
    });
}
```

```ts
import { send, parseJSON } from "nextjs-kit";

export function POST(request: NextRequest) {
    return send(() => {
        const data = await parseJSON(request);
        const newItem = await create(data);
        return Response.json(newItem);
    });
}
```

## Helpers

-   `send`
-   `parseJSON`
-   `parseFormData`

## Error Handling

Send catches all errors and maps `ServerError`s to appropriate responses. Other errors are mapped to a generic 500 response.

```ts
import { ServerError } from "nextjs-kit";

if (typeof data.id !== "string") {
    // By default the user message is empty.
    // To interpret the error message as the user message set `userMessage: true` 
    throw new ServerError("ID is not a string. Got " + typeof data.id, {
        status: 400,
        userMessage: "ID invalid",
    });
}
```
