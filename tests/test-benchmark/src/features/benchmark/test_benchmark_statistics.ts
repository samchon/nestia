import path from "path";

/**
 * Verifies the benchmark statistics of a set of events: their count, success
 * count, mean, standard deviation, minimum, and maximum.
 *
 * The standard deviation came from the mean of squares minus the square of the
 * mean, which cancels to a negative number when the elapsed times are equal and
 * large, so its square root was NaN.
 *
 * 1. Give events whose elapsed times are 2, 4, 4, 4, 5, 5, 7, 9 ms and assert the
 *    mean 5 and the standard deviation 2.
 * 2. Give 1000 identical durations at 10,000,000, 10,000,001 and 10,000,003 ms and
 *    require exactly 0 deviation, distinguishing negative cancellation and
 *    spurious positive deviation as well as the adjacent exact case.
 * 3. Give one event and no event and assert the single and the empty results.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `DynamicBenchmarkStatistics.of()` and asserts count, success, mean, standard deviation, minimum and maximum. The old squared-average subtraction yields negative variance for identical 10,000,001 ms durations and spurious positive variance for 10,000,003 ms; both must instead have zero deviation.
 * @evidence contracts/testing.md#independent-expectations The textbook sample 2, 4, 4, 4, 5, 5, 7, 9 has mean 5 and population standard deviation 2 by hand, and identical values have deviation exactly 0.
 * @evidence contracts/testing.md#distinguishing-cases The textbook set, three adjacent large constant populations, a single failed event and an empty list fix deviation, null measures and success counts. The spurious-positive control also rejects a clamp that merely hides negative variance.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-benchmark` process and loads the built `DynamicBenchmarkStatistics` by absolute path, since the exports map hides it; no servant process is spawned, which the E2E benchmark suite owns.
 */
export const test_benchmark_statistics = (): void => {
  const { DynamicBenchmarkStatistics } = require(
    path.resolve(
      process.cwd(),
      "..",
      "..",
      "packages",
      "benchmark",
      "lib",
      "internal",
      "DynamicBenchmarkStatistics",
    ),
  ) as {
    DynamicBenchmarkStatistics: {
      of: (events: IEvent[]) => IStatistics;
    };
  };
  const expect = (title: string, actual: unknown, expected: unknown): void => {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        `${title}: ${JSON.stringify(actual)}, not ${JSON.stringify(expected)}.`,
      );
  };

  expect(
    "textbook",
    DynamicBenchmarkStatistics.of(
      [2, 4, 4, 4, 5, 5, 7, 9].map((elapsed) => event(elapsed, true)),
    ),
    { count: 8, success: 8, mean: 5, stdev: 2, minimum: 2, maximum: 9 },
  );
  for (const elapsed of [10_000_000, 10_000_001, 10_000_003])
    expect(
      `large and equal ${elapsed}`,
      DynamicBenchmarkStatistics.of(
        Array.from({ length: 1000 }, () => event(elapsed, true)),
      ),
      {
        count: 1000,
        success: 1000,
        mean: elapsed,
        stdev: 0,
        minimum: elapsed,
        maximum: elapsed,
      },
    );
  expect("single", DynamicBenchmarkStatistics.of([event(3, false)]), {
    count: 1,
    success: 0,
    mean: 3,
    stdev: 0,
    minimum: 3,
    maximum: 3,
  });
  expect("empty", DynamicBenchmarkStatistics.of([]), {
    count: 0,
    success: 0,
    mean: null,
    stdev: null,
    minimum: null,
    maximum: null,
  });
};

interface IEvent {
  started_at: string;
  completed_at: string;
  success: boolean;
}

interface IStatistics {
  count: number;
  success: number;
  mean: number | null;
  stdev: number | null;
  minimum: number | null;
  maximum: number | null;
}

const event = (elapsed: number, success: boolean): IEvent => ({
  started_at: new Date(0).toISOString(),
  completed_at: new Date(elapsed).toISOString(),
  success,
});
