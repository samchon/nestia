import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api bbs article erase through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated bbs.articles namespace must exist while its ignored erase accessor is exactly undefined.
 * @evidence contracts/testing.md#independent-expectations The authored erase handler carries the ignore directive, whereas store/update remain public siblings. This establishes absence independently of current generated directory contents.
 * @evidence contracts/testing.md#distinguishing-cases An ignored endpoint contrasts adjacent visible endpoints and prevents a generation-wide empty namespace from serving as the expected result. This checks API exposure, not whether the underlying HTTP route remains callable.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual SDK generation and import must omit the ignored accessor from the exported namespace; inspecting an authored comment alone cannot prove the consumer surface.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_api_bbs_article_erase = (): void => {
  const erase = (api.functional.bbs.articles as any).erase;
  TestValidator.equals("ignore", erase, undefined);
};
