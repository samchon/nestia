import import2 from "import2";
import { IConnection } from "../IConnection";
import { Primitive } from "../Primitive";
import { IFetchRoute } from "./IFetchRoute";
import { Singleton } from "./Singleton";
import { HttpError } from "../HttpError";

export namespace FetcherBase {
    export interface IProps {
        className: string;
        encode: (
            input: any,
            headers: Record<string, IConnection.HeaderValue | undefined>,
        ) => string;
        decode: (
            input: string,
            headers: Record<string, IConnection.HeaderValue | undefined>,
        ) => any;
    }

    export const fetch =
        (props: IProps) =>
        async <Input, Output>(
            connection: IConnection,
            route: IFetchRoute<
                "DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT"
            >,
            input?: Input,
            stringify?: (input: Input) => string,
        ): Promise<Primitive<Output>> => {
            //----
            // REQUEST MESSSAGE
            //----
            // METHOD & HEADERS
            const headers: Record<string, IConnection.HeaderValue | undefined> =
                {
                    ...(connection.headers ?? {}),
                };
            if (input !== undefined) {
                if (route.request?.type === undefined)
                    throw new Error(
                        `Error on ${props.className}.fetch(): no content-type being configured.`,
                    );
                headers["Content-Type"] = route.request.type;
            }

            // INIT REQUEST DATA
            const init: RequestInit = {
                ...(connection.options ?? {}),
                method: route.method,
                headers: (() => {
                    const output: [string, string][] = [];
                    for (const [key, value] of Object.entries(headers))
                        if (value === undefined) continue;
                        else if (Array.isArray(value))
                            for (const v of value)
                                output.push([key, String(v)]);
                        else output.push([key, String(value)]);
                    return output;
                })(),
            };

            // CONSTRUCT BODY DATA
            if (input !== undefined)
                init.body = props.encode(
                    // BODY TRANSFORM
                    route.request?.type !== "text/plain"
                        ? (stringify ?? JSON.stringify)(input)
                        : input,
                    headers,
                );

            //----
            // RESPONSE MESSSAGE
            //----
            // URL SPECIFICATION
            const path: string =
                connection.host[connection.host.length - 1] !== "/" &&
                route.path[0] !== "/"
                    ? `/${route.path}`
                    : route.path;
            const url: URL = new URL(`${connection.host}${path}`);

            // DO FETCH
            const response: Response = await (
                await polyfill.get()
            )(url.href, init);

            // VALIDATE RESPONSE
            if (
                (route.status !== null && response.status !== route.status) ||
                (route.status === null &&
                    response.status !== 200 &&
                    response.status !== 201)
            )
                throw new HttpError(
                    route.method,
                    path,
                    response.status,
                    await response.text(),
                );
            else if (
                route.response?.type &&
                (
                    response.headers.get("content-type") ?? route.response.type
                )?.indexOf(route.response.type) === -1
            )
                throw new Error(
                    `Error on ${
                        props.className
                    }.fetch(): response type mismatched - expected ${
                        route.response.type
                    }, but ${response.headers.get("content-type")}.`,
                );

            // RETURNS
            if (route.method === "HEAD") return undefined!;
            else if (route.response?.type === "application/json") {
                const text: string = await response.text();
                return text.length ? JSON.parse(text) : undefined;
            }
            return props.decode(
                await response.text(),
                response_headers_to_object(response.headers),
            ) as Primitive<Output>;
        };
}

const polyfill = new Singleton(async (): Promise<typeof fetch> => {
    if (
        typeof global === "object" &&
        typeof global.process === "object" &&
        typeof global.process.versions === "object" &&
        typeof global.process.versions.node !== undefined
    ) {
        if (global.fetch === undefined)
            global.fetch = ((await import2("node-fetch")) as any).default;
        return (global as any).fetch;
    }
    return window.fetch;
});

const response_headers_to_object = (
    headers: Headers,
): Record<string, IConnection.HeaderValue | undefined> => {
    const output: Record<string, IConnection.HeaderValue> = {};
    headers.forEach((value, key) => {
        if (key === "set-cookie") {
            output[key] ??= [];
            (output[key] as string[]).push(
                ...value.split(";").map((str) => str.trim()),
            );
        } else output[key] = value;
    });
    return output;
};
