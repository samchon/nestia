import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api plain template through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated plain.template must echo the exact something_123_interesting_abc_is_not_true_it? string.
 * @evidence contracts/testing.md#independent-expectations The authored template-literal body declaration accepts the explicit chosen string and its echo handler establishes unchanged output independently of generated serializers.
 * @evidence contracts/testing.md#distinguishing-cases A string containing numeric/word/boolean template parts and punctuation contrasts the finite constant and unrestricted long-string cases. This is one accepted template value, not exhaustive invalid-template coverage.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native template validation and generated plain-text HTTP client must connect; a compile-time template assignment cannot certify the body reader.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_api_plain_template = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = "something_123_interesting_abc_is_not_true_it?";
  const y: string = await api.functional.plain.template(connection, x);

  TestValidator.equals("template", x as string, y);
};
