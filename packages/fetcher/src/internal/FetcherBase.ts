import { HttpError } from "../HttpError";
import { IConnection } from "../IConnection";
import { IFetchEvent } from "../IFetchEvent";
import { IFetchRoute } from "../IFetchRoute";
import { IPropagation } from "../IPropagation";
import { is_binary_response_content_type } from "./is_binary_response_content_type";
import { join_host_and_path, normalize_route_path } from "./join_host_and_path";

/**
 * Shared transport pipeline with injected body codecs.
 *
 * @internal
 */
export namespace FetcherBase {
  /**
   * Body transformations supplied by the plain or encrypted fetcher.
   *
   * The encode input has already undergone the route's body transformation.
   * Header records describe the corresponding request or response.
   */
  export interface IProps {
    /** Fetcher name used in request configuration errors. */
    className: string;

    /** Convert a transformed request body into its wire representation. */
    encode: (
      input: any,
      headers: Record<string, IConnection.HeaderValue | undefined>,
    ) => string;

    /** Decode a textual response not handled by a structured media branch. */
    decode: (
      input: string,
      headers: Record<string, IConnection.HeaderValue | undefined>,
    ) => any;
  }

  /**
   * Return successful response data and throw HttpError for a failed status.
   *
   * Binary response streams transfer to the caller for reading or cancellation;
   * an absent binary body is represented by a closed empty stream.
   */
  export const request =
    (props: IProps) =>
    async <Input, Output>(
      connection: IConnection,
      route: IFetchRoute<"DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT">,
      input?: Input,
      stringify?: (input: Input) => string,
    ): Promise<Output> => {
      const result = await _Propagate("fetch")(props)(
        connection,
        route,
        input,
        stringify,
      );
      if ((result as any).success === false)
        throw new HttpError(
          route.method,
          route.path,
          result.status as any as number,
          result.headers,
          result.data as string,
        );
      return result.data as Output;
    };

  /**
   * Return the classified HTTP response, including failed status payloads.
   *
   * Failed JSON responses are parsed when readable; malformed JSON remains
   * text. Transport and successful-body decoding errors still reject. Binary
   * response streams transfer to the caller for consumption or cancellation.
   */
  export const propagate =
    (props: IProps) =>
    async <Input>(
      connection: IConnection,
      route: IFetchRoute<"DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT">,
      input?: Input,
      stringify?: (input: Input) => string,
    ): Promise<IPropagation<any, any>> =>
      _Propagate("propagate")(props)(connection, route, input, stringify);

  /**
   * Executes one request and transfers binary stream ownership to its caller.
   *
   * A null successful binary body has no producer or bytes, so its replacement
   * stream must start closed. Actual response streams retain their identity;
   * reading and cancellation remain the caller's responsibility.
   *
   * @internal
   */
  const _Propagate =
    (method: string) =>
    (props: IProps) =>
    async <Input>(
      connection: IConnection,
      route: IFetchRoute<"DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT">,
      input?: Input,
      stringify?: (input: Input) => string,
    ): Promise<IPropagation<any, any>> => {
      //----
      // REQUEST MESSAGE
      //----
      // METHOD & HEADERS
      const headers: Record<string, IConnection.HeaderValue | undefined> = {
        ...(connection.headers ?? {}),
      };
      // a request carries its route's own content type, never the caller's:
      // multipart sets none at all, as fetch writes it with the boundary
      deleteHeader(headers, "content-type");
      if (input !== undefined) {
        if (route.request?.type === undefined)
          throw new Error(
            `Error on ${props.className}.fetch(): no content-type being configured.`,
          );
        else if (route.request.type !== "multipart/form-data")
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
              for (const v of value) output.push([key, String(v)]);
            else output.push([key, String(value)]);
          return output;
        })(),
      };

      // CONSTRUCT BODY DATA
      if (input !== undefined)
        init.body = props.encode(
          // BODY TRANSFORM
          route.request?.type === "application/x-www-form-urlencoded"
            ? request_query_body(input)
            : route.request?.type === "multipart/form-data"
              ? request_form_data_body(input as any)
              : route.request?.type !== "text/plain"
                ? (stringify ?? JSON.stringify)(input)
                : input,
          headers,
        );

      //----
      // RESPONSE MESSAGE
      //----
      // URL SPECIFICATION
      const path: string = normalize_route_path(route.path);
      const url: URL = new URL(join_host_and_path(connection.host, route.path));

      // DO FETCH
      const event: IFetchEvent = {
        route,
        path,
        status: null,
        input,
        output: undefined,
        started_at: new Date(),
        respond_at: null,
        completed_at: null!,
      };
      try {
        // TRY FETCH
        const response: Response = await (connection.fetch ?? fetch)(
          url.href,
          init,
        );
        event.respond_at = new Date();
        event.status = response.status;

        // CONSTRUCT RESULT DATA
        const result: IPropagation<any, any> = {
          success:
            response.status === 200 ||
            response.status === 201 ||
            response.status === route.status,
          status: response.status,
          headers: response_headers_to_object(response.headers),
          data: undefined!,
        } as any;
        if ((result as any).success === false) {
          // WHEN FAILED
          result.data = await response.text();
          const type = response.headers.get("content-type");
          if (
            method !== "fetch" &&
            type &&
            type.indexOf("application/json") !== -1
          )
            try {
              result.data = JSON.parse(result.data);
            } catch {}
        } else {
          // WHEN SUCCESS
          if (route.method === "HEAD") result.data = undefined!;
          else if (route.response?.type === "application/json") {
            const text: string = await response.text();
            result.data = text.length ? JSON.parse(text) : undefined;
          } else if (
            route.response?.type === "application/x-www-form-urlencoded"
          ) {
            const query: URLSearchParams = new URLSearchParams(
              await response.text(),
            );
            result.data = route.parseQuery ? route.parseQuery(query) : query;
          } else if (is_binary_response_content_type(route.response?.type))
            result.data =
              response.body ??
              new ReadableStream<Uint8Array>({
                start: (controller) => controller.close(),
              });
          else
            result.data = props.decode(await response.text(), result.headers);
        }
        event.output = result.data;
        return result;
      } finally {
        event.completed_at = new Date();
        if (connection.logger)
          try {
            await connection.logger(event);
          } catch {}
      }
    };
}

/** @internal */
const request_query_body = (input: any): URLSearchParams => {
  const q: URLSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value === undefined) continue;
    else if (Array.isArray(value))
      value.forEach((elem) => q.append(key, String(elem)));
    else q.set(key, String(value));
  return q;
};

/** @internal */
const request_form_data_body = (input: Record<string, any>): FormData => {
  const encoded: FormData = new FormData();
  const append = (key: string) => (value: any) => {
    if (value === undefined) return;
    else if (typeof File === "function" && value instanceof File)
      encoded.append(key, value, value.name);
    else encoded.append(key, value);
  };
  for (const [key, value] of Object.entries(input))
    if (Array.isArray(value)) value.forEach(append(key));
    else append(key)(value);
  return encoded;
};

/** @internal */
const response_headers_to_object = (
  headers: Headers,
): Record<string, string | string[]> => {
  const output: Record<string, string | string[]> = {};
  const cookieHeaders: string[] | undefined =
    typeof (headers as any).getSetCookie === "function"
      ? (headers as any).getSetCookie()
      : undefined;
  if (cookieHeaders?.length) output["set-cookie"] = cookieHeaders;

  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      if (cookieHeaders?.length) return;
      output[key] ??= [];
      (output[key] as string[]).push(value);
    } else output[key] = value;
  });
  return output;
};

const deleteHeader = (
  headers: Record<string, IConnection.HeaderValue | undefined>,
  name: string,
): void => {
  const normalized: string = name.toLowerCase();
  for (const key of Object.keys(headers))
    if (key.toLowerCase() === normalized) delete headers[key];
};
