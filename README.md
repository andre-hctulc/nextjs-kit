# nextjs-kit

Some [Next.JS](https://nextjs.org) utilities.

## Api

-   Server
    -   `send` - Route Handler helper
    -   `proc` - Action helper
    -   `parseJSON` - Parses a json request body
    -   `parseFormData` - Parses a form data request body
    -   `initOnce`
    -   `KitResponse` - Extends `NextResponse`
-   Client
    -   `useServerAction` - React hook for handling server actions
    -   `isErrorObject` - React hook for handling server actions
    -   `isSuccessObject` - React hook for handling server actions

## Server Side

`send` and `proc` are boundaries for catching and handling `ServerError`s

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
        const input = await parseJSON(request);
        const newProjectId = await createProject(input);
        return Response.json(newProjectId);
    });
}
```

```ts
"use server";

import { proc } from "nextjs-kit";

// Note: Server actions must be async!
export async function createProjectAction(input: CreateProjectInput) {
    return proc(() => createProject(input));
    // Or pass the promise directly:  proc(createProject(input));
}
```

### Error Handling

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

For non `ServerError`s a generic _500_ response is sent.

## Client Side

### Examples

`useServerAction`

```ts
import { isErrorObject, useServerAction } from "nextjs-kit";

const { action, isPending, data, error, errorObject, isSuccess } = useServerAction(createProjectAction);

function handleCreate(data: CreateProjectInput) {
    action(data);
}
```

`isErrorObject`

Note: actions wrapped in `proc` **do not** throw Errors!

```ts
const result = await createProjectAction(input);
if(isErrorObject(result)) return handleError(result);
}
```
