/**
 * @packageDocumentation
 * @module api.functional.body
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection, Primitive } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";

import type { ISomething, T } from "../../../controllers/TypedBodyController";

/**
 * @controller TypedBodyController.generic
 * @path POST /body/generic
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function generic(
  connection: IConnection,
  input: generic.Input,
): Promise<generic.Output> {
  return PlainFetcher.fetch(
    {
      ...connection,
      headers: {
        ...connection.headers,
        "Content-Type": "application/json",
      },
    },
    {
      ...generic.METADATA,
      template: generic.METADATA.path,
      path: generic.path(),
    },
    input,
  );
}
export namespace generic {
  export type Input = Primitive<ISomething<T>>;
  export type Output = Primitive<ISomething<T>>;

  export const METADATA = {
    method: "POST",
    path: "/body/generic",
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

  export const path = () => "/body/generic";
}
