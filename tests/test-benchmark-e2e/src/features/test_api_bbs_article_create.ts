import { RandomGenerator, TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "../api";
import { IBbsArticle } from "../api/structures/bbs/IBbsArticle";

/**
 * A workload feature the run's filter must leave out: it creates an article and
 * reads it back.
 *
 * It is a `POST`, so a report that lists one shows the filter did not apply.
 *
 * @evidence contracts/testing.md#behavioral-verification It creates an article and reads it back, and would assert their equality if it ran; the suite runs the benchmark with a filter that excludes it and fails if any endpoint of the report is not the selected feature's `PATCH`.
 * @evidence contracts/testing.md#independent-expectations The expected endpoint set is the one route of `test_api_count.ts`, which follows from the filter given to the master.
 * @evidence contracts/testing.md#distinguishing-cases This is the negative feature beside `test_api_count`: it exists so the filter has something to exclude, and its own assertions are not run by this suite.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-benchmark-e2e` suite) under `DynamicBenchmarker.master()`, which starts servant worker processes with `ttsx` against a real NestJS server on port 3000; the suite entry `src/index.ts` owns the run and the servants discover this function by the `test_api_` prefix under `src/features`.
 * @evidence contracts/e2e.md#necessary-boundary The servant loader applies the filter to the feature files it finds on disk in a worker process; only a real run shows that an excluded file is not executed.
 * @evidence contracts/e2e.md#shared-execution The suite runs `master()` once, with one server and three servant processes, and every assertion of the suite reads that one report: count, endpoint totals, filter, progress, and the peak of requests in flight; no assertion needs a second run, so the servant startup is paid once.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The server is created and closed by the suite in a `finally`, on a port the suite owns, and the servants are children of the run that end with it; the only file the run writes is the git-ignored `BENCHMARK.md`, so no earlier run determines a later result.
 * @evidence contracts/e2e.md#preserved-coverage It is the one survivor of the removed workload features, kept as the excluded case; the assertions it contains are not executed by any suite and are a limitation, not coverage.
 */
export async function test_api_bbs_article_create(
  connection: api.IConnection,
): Promise<void> {
  // STORE A NEW ARTICLE
  const stored: IBbsArticle = await api.functional.bbs.articles.create(
    connection,
    "general",
    {
      writer: RandomGenerator.name(),
      title: RandomGenerator.paragraph(),
      body: RandomGenerator.content(),
      format: "txt",
      files: [
        {
          name: "logo",
          extension: "png",
          url: "https://somewhere.com/logo.png",
        },
      ],
      password: v4(),
    },
  );

  // READ THE DATA AGAIN
  const read: IBbsArticle = await api.functional.bbs.articles.at(
    connection,
    stored.section,
    stored.id,
  );
  TestValidator.equals("created", stored, read);
}
