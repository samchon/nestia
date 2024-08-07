/**
 * @packageDocumentation
 * @module api.functional.arraySimple
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type {
  IConnection,
  IPropagation,
  Resolved,
  HttpError,
} from "@nestia/fetcher";
import { NestiaSimulator } from "@nestia/fetcher/lib/NestiaSimulator";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import type { ArraySimple } from "../../structures/ArraySimple";
import type { IPerson } from "../../structures/IPerson";

/**
 * @controller ArraySimpleController.index
 * @path GET /arraySimple
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function index(connection: IConnection): Promise<index.Output> {
  return !!connection.simulate
    ? index.simulate(connection)
    : PlainFetcher.propagate(connection, {
        ...index.METADATA,
        template: index.METADATA.path,
        path: index.path(),
      });
}
export namespace index {
  export type Output = IPropagation<{
    200: ArraySimple;
  }>;

  export const METADATA = {
    method: "GET",
    path: "/arraySimple",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: null,
  } as const;

  export const path = () => "/arraySimple";
  export const random = (
    g?: Partial<typia.IRandomGenerator>,
  ): Resolved<ArraySimple> => typia.random<ArraySimple>(g);
  export const simulate = (connection: IConnection): Output => {
    return {
      success: true,
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      data: random(
        "object" === typeof connection.simulate && null !== connection.simulate
          ? connection.simulate
          : undefined,
      ),
    };
  };
}

/**
 * @controller ArraySimpleController.at
 * @path GET /arraySimple/:id
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function at(
  connection: IConnection,
  id: string & Format<"uuid">,
): Promise<at.Output> {
  return !!connection.simulate
    ? at.simulate(connection, id)
    : PlainFetcher.propagate(connection, {
        ...at.METADATA,
        template: at.METADATA.path,
        path: at.path(id),
      });
}
export namespace at {
  export type Output = IPropagation<{
    200: IPerson;
  }>;

  export const METADATA = {
    method: "GET",
    path: "/arraySimple/:id",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: null,
  } as const;

  export const path = (id: string & Format<"uuid">) =>
    `/arraySimple/${encodeURIComponent(id ?? "null")}`;
  export const random = (
    g?: Partial<typia.IRandomGenerator>,
  ): Resolved<IPerson> => typia.random<IPerson>(g);
  export const simulate = (
    connection: IConnection,
    id: string & Format<"uuid">,
  ): Output => {
    const assert = NestiaSimulator.assert({
      method: METADATA.method,
      host: connection.host,
      path: path(id),
      contentType: "application/json",
    });
    try {
      assert.param("id")(() => typia.assert(id));
    } catch (exp) {
      if (!typia.is<HttpError>(exp)) throw exp;
      return {
        success: false,
        status: exp.status,
        headers: exp.headers,
        data: exp.toJSON().message,
      } as any;
    }
    return {
      success: true,
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      data: random(
        "object" === typeof connection.simulate && null !== connection.simulate
          ? connection.simulate
          : undefined,
      ),
    };
  };
}

/**
 * @controller ArraySimpleController.store
 * @path POST /arraySimple
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function store(
  connection: IConnection,
  body: store.Input,
): Promise<store.Output> {
  return !!connection.simulate
    ? store.simulate(connection, body)
    : PlainFetcher.propagate(
        {
          ...connection,
          headers: {
            ...connection.headers,
            "Content-Type": "application/json",
          },
        },
        {
          ...store.METADATA,
          template: store.METADATA.path,
          path: store.path(),
        },
        body,
      );
}
export namespace store {
  export type Input = IPerson;
  export type Output = IPropagation<{
    201: IPerson;
  }>;

  export const METADATA = {
    method: "POST",
    path: "/arraySimple",
    request: {
      type: "application/json",
      encrypted: false,
    },
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: null,
  } as const;

  export const path = () => "/arraySimple";
  export const random = (
    g?: Partial<typia.IRandomGenerator>,
  ): Resolved<IPerson> => typia.random<IPerson>(g);
  export const simulate = (
    connection: IConnection,
    body: store.Input,
  ): Output => {
    const assert = NestiaSimulator.assert({
      method: METADATA.method,
      host: connection.host,
      path: path(),
      contentType: "application/json",
    });
    try {
      assert.body(() => typia.assert(body));
    } catch (exp) {
      if (!typia.is<HttpError>(exp)) throw exp;
      return {
        success: false,
        status: exp.status,
        headers: exp.headers,
        data: exp.toJSON().message,
      } as any;
    }
    return {
      success: true,
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
      data: random(
        "object" === typeof connection.simulate && null !== connection.simulate
          ? connection.simulate
          : undefined,
      ),
    };
  };
}
