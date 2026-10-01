import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api plain constant through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated plain.constant must echo each exact A/B/C value.
 * @evidence contracts/testing.md#independent-expectations The authored constant union and echo handler establish all three accepted literal expectations independently of response output.
 * @evidence contracts/testing.md#distinguishing-cases All members of the finite literal union run rather than a single successful value. This case does not submit a value outside that union; dedicated plain diagnostic owners retain invalid declaration checks.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated text encoding, PlainBody validation and route response handling must connect; a local union validator cannot certify text transport.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_api_plain_constant = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const x of ["A", "B", "C"] as const) {
    const y = await api.functional.plain.constant(connection, x);
    TestValidator.equals("constant", x, y as "A");
  }
};
