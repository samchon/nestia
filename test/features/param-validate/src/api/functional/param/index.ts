/**
 * @packageDocumentation
 * @module api.functional.param
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";
import type { Primitive } from "typia";
import type { Format } from "typia/lib/tags/Format";

/**
 * Composite path parameters.
 *
 * @param value The first value.
 *              The first string value.
 * @param value2 The second value.
 *               The second string value.
 * @returns Concatenated string.
 *
 * @controller TypedParamController.composite
 * @path GET /param/:value/composite/:value2
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function composite(
  connection: IConnection,
  value: string,
  value2: string,
): Promise<composite.Output> {
  return PlainFetcher.fetch(connection, {
    ...composite.METADATA,
    template: composite.METADATA.path,
    path: composite.path(value, value2),
  });
}
export namespace composite {
  export type Output = Primitive<string>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/composite/:value2",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: string, value2: string) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/composite/${encodeURIComponent(value2?.toString() ?? "null")}`;
}

/**
 * Boolean path parameter.
 *
 * @param value The boolean value.
 *              The boolean value as a path parameter.
 * @returns The same boolean value.
 *
 * @controller TypedParamController.boolean
 * @path GET /param/:value/boolean
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function boolean(
  connection: IConnection,
  value: false | true,
): Promise<boolean.Output> {
  return PlainFetcher.fetch(connection, {
    ...boolean.METADATA,
    template: boolean.METADATA.path,
    path: boolean.path(value),
  });
}
export namespace boolean {
  export type Output = Primitive<false | true>;

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

  export const path = (value: false | true) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/boolean`;
}

/**
 * The number.
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
 * The bigint.
 * @controller TypedParamController.bigint
 * @path GET /param/:value/bigint
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function bigint(
  connection: IConnection,
  value: bigint,
): Promise<bigint.Output> {
  return PlainFetcher.fetch(connection, {
    ...bigint.METADATA,
    template: bigint.METADATA.path,
    path: bigint.path(value),
  });
}
export namespace bigint {
  export type Output = Primitive<number>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/bigint",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: bigint) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/bigint`;
}

/**
 * The string.
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
  value: null | string,
): Promise<nullable.Output> {
  return PlainFetcher.fetch(connection, {
    ...nullable.METADATA,
    template: nullable.METADATA.path,
    path: nullable.path(value),
  });
}
export namespace nullable {
  export type Output = Primitive<null | string>;

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

  export const path = (value: null | string) =>
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

/**
 * @controller TypedParamController.uuid
 * @path GET /param/:value/uuid
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function uuid(
  connection: IConnection,
  value: string & Format<"uuid">,
): Promise<uuid.Output> {
  return PlainFetcher.fetch(connection, {
    ...uuid.METADATA,
    template: uuid.METADATA.path,
    path: uuid.path(value),
  });
}
export namespace uuid {
  export type Output = Primitive<string>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/uuid",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: string & Format<"uuid">) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/uuid`;
}

/**
 * @controller TypedParamController.date
 * @path GET /param/:value/date
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function date(
  connection: IConnection,
  value: string & Format<"date">,
): Promise<date.Output> {
  return PlainFetcher.fetch(connection, {
    ...date.METADATA,
    template: date.METADATA.path,
    path: date.path(value),
  });
}
export namespace date {
  export type Output = Primitive<string>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/date",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: string & Format<"date">) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/date`;
}

/**
 * @controller TypedParamController.uuid_nullable
 * @path GET /param/:value/uuid_nullable
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function uuid_nullable(
  connection: IConnection,
  value: null | (string & Format<"uuid">),
): Promise<uuid_nullable.Output> {
  return PlainFetcher.fetch(connection, {
    ...uuid_nullable.METADATA,
    template: uuid_nullable.METADATA.path,
    path: uuid_nullable.path(value),
  });
}
export namespace uuid_nullable {
  export type Output = Primitive<null | string>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/uuid_nullable",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: null | (string & Format<"uuid">)) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/uuid_nullable`;
}

/**
 * @controller TypedParamController.date_nullable
 * @path GET /param/:value/date_nullable
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function date_nullable(
  connection: IConnection,
  value: null | (string & Format<"date">),
): Promise<date_nullable.Output> {
  return PlainFetcher.fetch(connection, {
    ...date_nullable.METADATA,
    template: date_nullable.METADATA.path,
    path: date_nullable.path(value),
  });
}
export namespace date_nullable {
  export type Output = Primitive<null | string>;

  export const METADATA = {
    method: "GET",
    path: "/param/:value/date_nullable",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (value: null | (string & Format<"date">)) =>
    `/param/${encodeURIComponent(value?.toString() ?? "null")}/date_nullable`;
}