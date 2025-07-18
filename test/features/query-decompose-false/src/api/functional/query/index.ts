/**
 * @packageDocumentation
 * @module api.functional.query
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";
import type { Primitive, Resolved } from "typia";

import type { INestQuery } from "../../structures/INestQuery";
import type { IQuery } from "../../structures/IQuery";

/**
 * @controller QueryController.typed
 * @path GET /query/typed
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function typed(
  connection: IConnection,
  query: typed.Query,
): Promise<typed.Output> {
  return PlainFetcher.fetch(connection, {
    ...typed.METADATA,
    template: typed.METADATA.path,
    path: typed.path(query),
  });
}
export namespace typed {
  export type Query = Resolved<IQuery>;
  export type Output = Primitive<IQuery>;

  export const METADATA = {
    method: "GET",
    path: "/query/typed",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (query: Query) => {
    const variables: URLSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query as any))
      if (undefined === value) continue;
      else if (Array.isArray(value))
        value.forEach((elem: any) => variables.append(key, String(elem)));
      else variables.set(key, String(value));
    const location: string = "/query/typed";
    return 0 === variables.size
      ? location
      : `${location}?${variables.toString()}`;
  };
}

/**
 * @controller QueryController.nest
 * @path GET /query/nest
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function nest(
  connection: IConnection,
  query: nest.Query,
): Promise<nest.Output> {
  return PlainFetcher.fetch(connection, {
    ...nest.METADATA,
    template: nest.METADATA.path,
    path: nest.path(query),
  });
}
export namespace nest {
  export type Query = Resolved<INestQuery>;
  export type Output = Primitive<IQuery>;

  export const METADATA = {
    method: "GET",
    path: "/query/nest",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (query: Query) => {
    const variables: URLSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query as any))
      if (undefined === value) continue;
      else if (Array.isArray(value))
        value.forEach((elem: any) => variables.append(key, String(elem)));
      else variables.set(key, String(value));
    const location: string = "/query/nest";
    return 0 === variables.size
      ? location
      : `${location}?${variables.toString()}`;
  };
}

/**
 * @controller QueryController.individual
 * @path GET /query/individual
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function individual(
  connection: IConnection,
  id: string,
): Promise<individual.Output> {
  return PlainFetcher.fetch(connection, {
    ...individual.METADATA,
    template: individual.METADATA.path,
    path: individual.path(id),
  });
}
export namespace individual {
  export type Output = Primitive<string>;

  export const METADATA = {
    method: "GET",
    path: "/query/individual",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (id: string) => {
    const variables: URLSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries({
      id: id,
    } as any))
      if (undefined === value) continue;
      else if (Array.isArray(value))
        value.forEach((elem: any) => variables.append(key, String(elem)));
      else variables.set(key, String(value));
    const location: string = "/query/individual";
    return 0 === variables.size
      ? location
      : `${location}?${variables.toString()}`;
  };
}

/**
 * @controller QueryController.composite
 * @path GET /query/composite
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function composite(
  connection: IConnection,
  atomic: string,
  query: composite.Query,
): Promise<composite.Output> {
  return PlainFetcher.fetch(connection, {
    ...composite.METADATA,
    template: composite.METADATA.path,
    path: composite.path(atomic, query),
  });
}
export namespace composite {
  export type Query = Resolved<Omit<IQuery, "atomic">>;
  export type Output = Primitive<IQuery>;

  export const METADATA = {
    method: "GET",
    path: "/query/composite",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = (atomic: string, query: Query) => {
    const variables: URLSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries({
      ...query,
      atomic: atomic,
    } as any))
      if (undefined === value) continue;
      else if (Array.isArray(value))
        value.forEach((elem: any) => variables.append(key, String(elem)));
      else variables.set(key, String(value));
    const location: string = "/query/composite";
    return 0 === variables.size
      ? location
      : `${location}?${variables.toString()}`;
  };
}
