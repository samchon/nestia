import { TestValidator } from "@nestia/e2e";

import api from "../../../api";

/**
 * Verifies calls the generated at simulator with null section and a valid UUID
 * and requires HttpError 400.
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
export const test_clone_simulate_invalid_string = (
  connection: api.IConnection,
): Promise<void> =>
  TestValidator.httpError("invalid string", 400, () =>
    api.functional.http_rich.options.simulation.bbs.articles.at(
      connection,
      null!,
      uuid(),
    ),
  );

/**
 * Supplies the original valid UUID control for the malformed string case.
 *
 * @evidence contracts/testing.md#behavioral-verification This helper supplies the unchanged UUID control; its caller asserts generated simulator HttpError 400 for a null section.
 * @evidence contracts/testing.md#independent-expectations The original UUID version and variant template supplies an independently valid companion argument rather than reading generated output.
 * @evidence contracts/testing.md#distinguishing-cases Valid UUID with null section distinguishes the string validator from the separate malformed UUID case.
 * @evidence contracts/testing.md#execution-ownership The helper is called only by the matching discovered invalid-string case and is not an independent test entry.
 * @evidence contracts/e2e.md#necessary-boundary The caller uses this control at the actual installed generated simulator connection; the helper alone makes no product boundary call.
 * @evidence contracts/e2e.md#shared-execution This local generator uses the caller's shared consumer and requires no installation, compilation or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local random characters retain no shared mutable state and cannot alter the producer state or route counter.
 * @evidence contracts/e2e.md#preserved-coverage The original UUID template and generation body remain unchanged alongside the original malformed-string assertion.
 */
export const uuid = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
