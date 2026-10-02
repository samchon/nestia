import { IBenchmarkEvent } from "../IBenchmarkEvent";

/**
 * The operations the master may call on a servant through the worker
 * connection.
 *
 * @evidence contracts/common.md#principled-implementation The interface lists the one call the master makes: run a share of benchmark function invocations and return their logged HTTP events.
 * @evidence contracts/common.md#clear-and-simple-design One member, no behavior in the type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is the RPC contract of the servant, not a test-specific seam.
 * @evidence contracts/common.md#meaningful-documentation The comment states which side implements it.
 */
export interface IBenchmarkServant {
  /**
   * Runs the requested number of benchmark function invocations with the given
   * simultaneous budget and returns every logged HTTP event. One invocation can
   * log zero, one or several events.
   *
   * @evidence contracts/common.md#principled-implementation The master gives each servant its share of the count and of the simultaneous budget, and the servant returns the events for its share.
   * @evidence contracts/common.md#clear-and-simple-design One request-response operation with two numbers in and events out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The servant runs what the master assigned, without adjusting the budget.
   * @evidence contracts/common.md#meaningful-documentation The comment states the arguments and the returned events.
   */
  execute(props: {
    count: number;
    simultaneous: number;
  }): Promise<IBenchmarkEvent[]>;
}
