import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies a `HEAD` route resolves through the SDK with no content.
 *
 * 1. Call the `HEAD` route through the SDK.
 * 2. Assert the result is `undefined`, since a `HEAD` response has no body.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated method.head request must resolve with exactly undefined.
 * @evidence contracts/testing.md#independent-expectations The authored HEAD handler is bodyless and HTTP HEAD carries no response body; that independent contract establishes undefined rather than an emitted-output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases HEAD contrasts ordinary GET response decoding and rejects an unexpected decoded payload. This single route does not assert every header/status or HEAD error response.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated HEAD dispatch and fetcher bodyless response handling must connect over HTTP; a void type identity does not establish it.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_api_method_head = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "output",
    await api.functional.method.head(connection),
    undefined,
  );
};
