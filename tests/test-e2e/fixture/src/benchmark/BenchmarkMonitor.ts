import { INestApplication } from "@nestjs/common";
import { IncomingMessage, ServerResponse } from "node:http";

let inFlight = 0;
let peak = 0;
let requests = 0;

/**
 * Observes benchmark requests until response close without changing other
 * routes.
 *
 * Counting at receipt and releasing at close measures actual overlapping HTTP
 * requests independently of the master's event and slot calculations.
 *
 * @evidence contracts/common.md#principled-implementation Each matching received request increments once and a once-only response-close listener decrements once, so peak observes actual outstanding responses independently of worker reports. A twenty-millisecond dispatch delay permits overlapping requests to expose excessive worker budgets.
 * @evidence contracts/common.md#clear-and-simple-design One middleware owns the scoped observation and dispatch delay; unrelated routes immediately call next. The read/reset operations keep observation access separate from registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is authored test observation around a dedicated route, not a production-name branch or replacement of Nest/HTTP methods. It neither modifies benchmark scheduling nor supplies expected report values.
 * @evidence contracts/common.md#meaningful-documentation The comment explains receipt-to-close measurement and its independent oracle role rather than presenting the counters as master implementation state.
 * @evidence contracts/performance.md#efficient-algorithms Matching each request costs constant work and retains one listener plus one short-lived timer; aggregate counters do not retain historical requests or event payloads.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each request has a distinct response-close lifetime and must be observed separately; registration coordinates no reusable computation across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The common backend installs one middleware for its lifetime. Each accepted request owns one twenty-millisecond timer and a once-only close listener; timer callback and response close release those handles, while three numeric counters remain with the producer module until sandbox teardown.
 */
export const installBenchmarkMonitor = (
  application: INestApplication,
): void => {
  application.use(
    (request: IncomingMessage, response: ServerResponse, next: () => void) => {
      if (request.url !== "/benchmark/count") return next();
      ++requests;
      peak = Math.max(peak, ++inFlight);
      response.once("close", () => --inFlight);
      setTimeout(next, 20);
    },
  );
};

/**
 * Starts the workload observation only after preceding consumers have settled.
 *
 * Reset refuses an active observation so a late close cannot corrupt the next
 * workload's count or make outstanding responses disappear from its oracle.
 *
 * @evidence contracts/common.md#principled-implementation A zero outstanding-response precondition permits resetting peak and request totals without losing active lifetimes; otherwise reset rejects before changing either counter.
 * @evidence contracts/common.md#clear-and-simple-design One guard precedes two scalar assignments; middleware registration and snapshot reading remain with their own operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reset operates only on authored observer state and never changes the application, worker scheduler or foreign process globals.
 * @evidence contracts/common.md#meaningful-documentation The comment states the settlement precondition and why allowing late closes across a reset would invalidate the oracle.
 * @evidence contracts/performance.md#efficient-algorithms Reset checks and clears a fixed number of numeric counters in constant time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation clears completed observation state and coordinates no cached or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reset neither acquires nor releases handles; the middleware and common backend own response and application lifetimes.
 */
export const resetBenchmarkMonitor = (): void => {
  if (inFlight !== 0)
    throw new Error("Benchmark requests are still in flight.");
  peak = 0;
  requests = 0;
};

/**
 * Returns a snapshot independent of the benchmark master's event aggregation.
 *
 * Copying scalars prevents a caller from mutating the live observation, while
 * later requests remain visible only through a new snapshot.
 *
 * @evidence contracts/common.md#principled-implementation The returned object copies current numeric counters; callers cannot change the module's observation through that object's properties.
 * @evidence contracts/common.md#clear-and-simple-design A single object expression exposes outstanding responses, maximum overlap and total received requests without exposing mutable observer internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reading observes actual middleware counters and computes no report-derived expected answer or fixture-specific scheduling compensation.
 * @evidence contracts/common.md#meaningful-documentation The comment explains snapshot ownership and why a later read is required to observe new requests.
 * @evidence contracts/performance.md#efficient-algorithms Reading copies three scalar values in constant time and space, independent of the number of historical requests.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call observes the current counters rather than sharing a completed computation whose validity would depend on future request events.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation returns a caller-owned snapshot and retains no resource or history itself.
 */
export const readBenchmarkMonitor = () => ({ inFlight, peak, requests });
