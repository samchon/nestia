import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "@api";

const test = api.functional.success.get;

/**
 * Verifies invalid through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated success.get accessor must expose status401 with exact INVALID_PERMISSION data rather than return a successful number or throw an untyped result.
 * @evidence contracts/testing.md#independent-expectations SuccessController throws UnauthorizedException(INVALID_PERMISSION), and its authored filter/TypedException declaration expose the permission literal. Those independently establish401 and the exact propagated body.
 * @evidence contracts/testing.md#distinguishing-cases A controller method whose declared success is number actually rejects with the documented string exception, pinning discriminated propagation. Sibling permission/union cases retain their distinct literal scenarios.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual exception filtering, generated IPropagation typing and HTTP decoding must connect; a standalone union identity cannot establish the observed status/body.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_success_invalid_permission = async (
  connection: IConnection,
) => {
  const response = await test(connection);
  if (response.status === 401)
    TestValidator.equals("response", response.data, "INVALID_PERMISSION");
  else throw Error("unexpected response");
};
