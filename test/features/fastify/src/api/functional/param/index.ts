/**
 * @packageDocumentation
 * @module api.functional.param
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";
import type { Primitive } from "typia";

/**
 * @controller TypedParamController.boolean
 * @path GET /param/:value/boolean
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function boolean(
  connection: IConnection,
  value: boolean,
): Promise<boolean.Output> {
  return PlainFetcher.fetch(connection, {
    ...boolean.METADATA,
    template: boolean.METADATA.path,
    path: boolean.path(value),
  });
}
export namespace boolean {
  export type Output = Primitive<boolean>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/boolean",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: boolean) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/boolean`;
}

/**
 * @controller TypedParamController.number
 * @path GET /param/:value/number
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function number(
  connection: IConnection,
  value: number,
): Promise<number.Output> {
  return PlainFetcher.fetch(connection, {
    ...number.METADATA,
    template: number.METADATA.path,
    path: number.path(value),
  });
}
export namespace number {
  export type Output = Primitive<number>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/number",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: number) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/number`;
}

/**
 * @controller TypedParamController.string
 * @path GET /param/:value/string
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function string(
  connection: IConnection,
  value: string,
): Promise<string.Output> {
  return PlainFetcher.fetch(connection, {
    ...string.METADATA,
    template: string.METADATA.path,
    path: string.path(value),
  });
}
export namespace string {
  export type Output = Primitive<string>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/string",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: string) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/string`;
}

/**
 * @controller TypedParamController.nullable
 * @path GET /param/:value/nullable
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function nullable(
  connection: IConnection,
  value: string | null,
): Promise<nullable.Output> {
  return PlainFetcher.fetch(connection, {
    ...nullable.METADATA,
    template: nullable.METADATA.path,
    path: nullable.path(value),
  });
}
export namespace nullable {
  export type Output = Primitive<string | null>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/nullable",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: string | null) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/nullable`;
}

/**
 * @controller TypedParamController.literal
 * @path GET /param/:value/literal
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function literal(
  connection: IConnection,
  value: "A" | "B" | "C",
): Promise<literal.Output> {
  return PlainFetcher.fetch(connection, {
    ...literal.METADATA,
    template: literal.METADATA.path,
    path: literal.path(value),
  });
}
export namespace literal {
  export type Output = Primitive<"A" | "B" | "C">;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/literal",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: "A" | "B" | "C") =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/literal`;
}
