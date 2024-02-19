/**
 * @packageDocumentation
 * @module api.functional
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection, Primitive } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";

import type { IToken } from "../structures/IToken";

/**
 * @controller SecurityController.bearer
 * @path GET /bearer
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function bearer(connection: IConnection): Promise<bearer.Output> {
  return PlainFetcher.fetch(connection, {
    ...bearer.METADATA,
    path: bearer.path(),
  } as const);
}
export namespace bearer {
  export type Output = Primitive<IToken>;

  export const METADATA = {
    method: "GET",
    path: "/bearer",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: null,
  } as const;

  export const path = (): string => {
    return `/bearer`;
  };
}