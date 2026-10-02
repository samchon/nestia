import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import api from "@api";
import { IPage } from "@api/lib/structures/IPage";

/**
 * Calls the generated query simulator with page set to one and requires
 * HttpError 400.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated query simulator with page set to one and requires HttpError 400.
 * @evidence contracts/testing.md#independent-expectations The authored page request requires a number, so a string page is independently invalid while other fields use valid generated data.
 * @evidence contracts/testing.md#distinguishing-cases Changing one query field isolates query validation rather than body or path checks. This case does not assert successful pagination output.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under simulate/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The simulate fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Changing one query field isolates query validation rather than body or path checks. This case does not assert successful pagination output.
 */
export const test_api_simulate_invalid_query = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid query", 400, () =>
    api.functional.bbs.articles.query(
      connection,
      typia.random<Primitive<string>>(),
      {
        ...typia.random<Primitive<IPage.IRequest>>(),
        page: "one" as any as number,
      },
    ),
  );
