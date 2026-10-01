import { IFetchRoute } from "@nestia/fetcher";

/**
 * One benchmarked request as the servant observed it.
 *
 * `metadata` is the fetch route, `status` is the HTTP status or `null` when
 * there was no response, and the three timestamps are ISO 8601 strings, with
 * `respond_at` `null` when no response arrived. `success` is `false` for every
 * request made by a benchmark function that threw.
 *
 * @evidence contracts/common.md#principled-implementation The event mirrors the fetcher's log event with timestamps in ISO strings, so it can cross the process boundary as plain data.
 * @evidence contracts/common.md#clear-and-simple-design A flat record shared by the servant, the master, and the report code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are copied from the fetcher's event; none is synthesized.
 * @evidence contracts/common.md#meaningful-documentation The comment states each optional state and the meaning of success.
 */
export interface IBenchmarkEvent {
  metadata: IFetchRoute<any>;
  status: number | null;
  started_at: string;
  respond_at: string | null;
  completed_at: string;
  success: boolean;
}
