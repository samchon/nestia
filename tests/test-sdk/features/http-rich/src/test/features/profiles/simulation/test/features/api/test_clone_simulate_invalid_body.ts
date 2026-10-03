import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import type { SimulationIBbsArticle } from "../../../../../../../structures/simulation/SimulationIBbsArticle";
import api from "../../../api";

/**
 * Verifies calls the generated store simulator with a numeric title and
 * requires HttpError 400.
 *
 * A real server can also reject malformed input, so this retained case runs
 * with simulate true and participates in the final no-transport guard.
 *
 * 1. Call the actual generated simulator with the original malformed value.
 * 2. Require the original HttpError 400 result.
 *
 * @evidence contracts/testing.md#behavioral-verification The original generated simulator call must reject its authored malformed input with HttpError 400.
 * @evidence contracts/testing.md#independent-expectations The literal 400 expectation and one-field malformed value come from the original fixture and documented validator contract, not current output.
 * @evidence contracts/testing.md#distinguishing-cases This case retains its original malformed field and valid remaining arguments. Generated cases provide valid controls and the final producer-state/request guard rejects real HTTP fallback.
 * @evidence contracts/testing.md#execution-ownership The matching authored case is discovered in the shared consumer profile and receives simulate true from its declared execution policy.
 * @evidence contracts/e2e.md#necessary-boundary The actual installed SDK must emit and execute its simulator validation branch; direct type metadata units cannot prove generated runtime rejection.
 * @evidence contracts/e2e.md#shared-execution The simulation profile shares the installed graph, one producer, one consumer and listener with other profiles; this case creates none of those resources.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique simulation routes and DTO identities isolate the input graph. Every call receives simulate true and the final actual-producer guard checks no handler or request activity without resetting state.
 * @evidence contracts/e2e.md#preserved-coverage The original malformed arguments and HttpError 400 assertion remain after reversible imports, DTO names, function names and route accessors; all five original invalid cases execute.
 */
export const test_clone_simulate_invalid_body = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid body", 400, () =>
    api.functional.http_rich.options.simulation.bbs.articles.store(
      connection,
      typia.random<Primitive<string>>(),
      {
        ...typia.random<Primitive<SimulationIBbsArticle.IStore>>(),
        title: 3 as any as string,
      },
    ),
  );
