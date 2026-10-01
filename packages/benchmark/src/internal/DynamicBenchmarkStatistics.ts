import type { DynamicBenchmarker } from "../DynamicBenchmarker";
import type { IBenchmarkEvent } from "../IBenchmarkEvent";

/**
 * Statistics of benchmarked events.
 *
 * @evidence contracts/common.md#principled-implementation The success count uses one filter, while mean, population standard deviation, minimum and maximum share one pass over event start/completion durations. Both operations are linear in the event population.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with one exported function; the elapsed-time measures are a private helper of it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The formulas are standard statistics without tuning to any benchmark result.
 * @evidence contracts/common.md#meaningful-documentation The comment states its single job.
 */
export namespace DynamicBenchmarkStatistics {
  /**
   * Summarizes events into counts and elapsed-time statistics.
   *
   * Durations are milliseconds. The empty set has `null` measures, and the
   * standard deviation is the population deviation computed with Welford's
   * update.
   *
   * @evidence contracts/common.md#principled-implementation Welford's update accumulates deviations from a running mean, avoiding the subtraction of nearly equal large squared averages that caused cancellation in constant durations. The variance divisor is the population count; floating-point arithmetic remains approximate rather than a claim of exact arithmetic for every possible input.
   * @evidence contracts/common.md#clear-and-simple-design One shared pass computes the elapsed measures, a separate filter counts successes, and the empty elapsed population is answered before the loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The method is the recognized single-pass algorithm rather than a compensating clamp.
   * @evidence contracts/common.md#meaningful-documentation The comment states the unit, the empty-set convention, and the algorithm.
   */
  export const of = (
    events: IBenchmarkEvent[],
  ): DynamicBenchmarker.IReport.IStatistics => ({
    count: events.length,
    success: events.filter((event) => event.success).length,
    ...elapsed(events),
  });

  const elapsed = (
    events: IBenchmarkEvent[],
  ): Pick<
    DynamicBenchmarker.IReport.IStatistics,
    "mean" | "stdev" | "minimum" | "maximum"
  > => {
    if (events.length === 0)
      return { mean: null, stdev: null, minimum: null, maximum: null };
    // Welford's single pass keeps the sum of squared deviations from the
    // running mean, so it stays non-negative where the difference between the
    // mean of squares and the squared mean cancels to a negative value and the
    // square root returns NaN.
    let count: number = 0;
    let mean: number = 0;
    let deviations: number = 0;
    let minimum: number = Number.POSITIVE_INFINITY;
    let maximum: number = Number.NEGATIVE_INFINITY;
    for (const event of events) {
      const value: number =
        new Date(event.completed_at).getTime() -
        new Date(event.started_at).getTime();
      const delta: number = value - mean;
      mean += delta / ++count;
      deviations += delta * (value - mean);
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    return { mean, stdev: Math.sqrt(deviations / count), minimum, maximum };
  };
}
