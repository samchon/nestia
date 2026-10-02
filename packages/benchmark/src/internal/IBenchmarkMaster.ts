/**
 * The operations a servant may call on the master through the worker
 * connection.
 *
 * @evidence contracts/common.md#principled-implementation The interface lists the two calls the servant makes back to the master: whether to load a file and how many benchmark function invocations have completed.
 * @evidence contracts/common.md#clear-and-simple-design Two members, one per callback, with no behavior in the type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is the RPC contract of the master, not a test-specific seam.
 * @evidence contracts/common.md#meaningful-documentation The comment states which side implements it.
 */
export interface IBenchmarkMaster {
  /**
   * Asks the master whether a benchmark file, by basename, may be imported.
   *
   * @evidence contracts/common.md#principled-implementation The servant asks before every import so the master's predicate decides which modules load.
   * @evidence contracts/common.md#clear-and-simple-design One predicate over a file name.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The answer is the caller's filter, not a fixed list.
   * @evidence contracts/common.md#meaningful-documentation The comment states the argument and the meaning of the answer.
   */
  filter: (file: string) => boolean;

  /**
   * Reports the number of benchmark function invocations this servant has
   * completed so far, independently of logged HTTP event count.
   *
   * @evidence contracts/common.md#principled-implementation A servant reports its own cumulative count, and the master sums the servants' counts.
   * @evidence contracts/common.md#clear-and-simple-design One notification with one number.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The count is measured by the servant, not estimated.
   * @evidence contracts/common.md#meaningful-documentation The comment states that the value is cumulative and per servant.
   */
  progress: (current: number) => void;
}
