import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import api from "@api";
import type { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Calls the generated store simulator with a numeric title and requires
 * HttpError 400.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated store simulator with a numeric title and requires HttpError 400.
 * @evidence contracts/testing.md#independent-expectations The authored IStore title is string; replacing only it with number violates the request contract independently of the simulator.
 * @evidence contracts/testing.md#distinguishing-cases A generated otherwise-valid body with one invalid field isolates body validation. This case covers rejection, not successful simulated storage.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. A generated otherwise-valid body with one invalid field isolates body validation. This case covers rejection, not successful simulated storage.
 */
export const test_api_simulate_invalid_body = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid body", 400, () =>
    api.functional.bbs.articles.store(
      connection,
      typia.random<Primitive<string>>(),
      {
        ...typia.random<Primitive<IBbsArticle.IStore>>(),
        title: 3 as any as string,
      },
    ),
  );
