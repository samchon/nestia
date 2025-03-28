/**
 * @packageDocumentation
 * @module api.functional.x.performance
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";
import type { Primitive } from "typia";

import type { IPerformance } from "../../../structures/IPerformance";

/**
 * @controller PerformanceController.get
 * @path GET /x/performance
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function get(connection: IConnection): Promise<get.Output> {
  return PlainFetcher.fetch(connection, {
    ...get.METADATA,
    template: get.METADATA.path,
    path: get.path(),
  });
}
export namespace get {
  export type Output = Primitive<IPerformance>;

  export const METADATA = {
    method: "GET",
    path: "/x/performance",
    request: null,
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 200,
  } as const;

  export const path = () => "/x/performance";
}
