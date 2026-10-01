/**
 * Live observations owned by the currently acquired producer backend.
 *
 * Consumers carry independent DTO copies, while these callbacks retain the
 * actual producer state identity without importing its source program.
 *
 * @evidence contracts/common.md#principled-implementation The structural callbacks expose the native request count and actual original Bbs Global bit; the explicit reset begins a new observed simulation interval after a real positive.
 * @evidence contracts/common.md#clear-and-simple-design Only constant observations and one owned fixture reset cross the same-process producer/consumer boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type supplies no mocked fetch, alternate server or fabricated producer state.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes actual backend identity from independent consumer DTO copies.
 */
export interface IRichContext {
  httpRequests: () => number;
  simulationOriginal: {
    used: () => boolean;
    reset: () => void;
  };
}
