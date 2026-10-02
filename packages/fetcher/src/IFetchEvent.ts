import { IFetchRoute } from "./IFetchRoute";

/**
 * Event of one completed fetch, passed to {@link IConnection.logger}.
 *
 * `status` and `respond_at` are `null` when no response arrived, and
 * `completed_at` is set after response processing or transport failure. Binary
 * success streams are handed to the caller without reading their bytes, so this
 * timestamp does not measure the duration of their consumption. `input` is the
 * value the caller passed and `output` is the response data, the error body for
 * a failed status, or `undefined` when the request threw. These values retain
 * their original references. Errors before transport, such as encoding or URL
 * construction failures, do not create a logged event.
 *
 * @evidence contracts/common.md#principled-implementation The event records the route, the request input, the observed status and output, and the three instants of the exchange, which is what a logger or a benchmark needs to compute latency and to group by endpoint.
 * @evidence contracts/common.md#clear-and-simple-design A flat record; the two nullable members mark the states with no response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value is measured by the pipeline; none is defaulted to a plausible value.
 * @evidence contracts/common.md#meaningful-documentation The comment states the states with no response and what input and output hold.
 */
export interface IFetchEvent {
  /** Metadata used to execute the request. */
  route: IFetchRoute<"DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT">;

  /** Route path normalized to one leading slash. */
  path: string;

  /** Received HTTP status, or null when transport produced no response. */
  status: number | null;

  /** Original request value; no defensive copy is made. */
  input: any;

  /** Decoded payload or transferred binary stream, absent on processing error. */
  output: any;

  /** Start of the transport operation, after request preparation. */
  started_at: Date;

  /** Response arrival, before response body processing; null without a response. */
  respond_at: Date | null;

  /** End of response processing, before the logger is awaited. */
  completed_at: Date;
}
