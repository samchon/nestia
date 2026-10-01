import { IFetchRoute } from "./IFetchRoute";

/**
 * Event of one completed fetch, passed to {@link IConnection.logger}.
 *
 * `status` and `respond_at` are `null` when no response arrived, and
 * `completed_at` is set after the body has been read or the request failed.
 * `input` is the value the caller passed and `output` is the response data, the
 * error body for a failed status, or `undefined` when the request threw.
 *
 * @evidence contracts/common.md#principled-implementation The event records the route, the request input, the observed status and output, and the three instants of the exchange, which is what a logger or a benchmark needs to compute latency and to group by endpoint.
 * @evidence contracts/common.md#clear-and-simple-design A flat record; the two nullable members mark the states with no response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value is measured by the pipeline; none is defaulted to a plausible value.
 * @evidence contracts/common.md#meaningful-documentation The comment states the states with no response and what input and output hold.
 */
export interface IFetchEvent {
  route: IFetchRoute<"DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT">;
  path: string;
  status: number | null;
  input: any;
  output: any;
  started_at: Date;
  respond_at: Date | null;
  completed_at: Date;
}
