import { RandomGenerator, TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api plain string through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated plain.string must return the exact submitted one-million-character string.
 * @evidence contracts/testing.md#independent-expectations The original generated alphabet string itself is the independent expected echo; no server-generated expected snapshot or random-response shape oracle supplies equality.
 * @evidence contracts/testing.md#distinguishing-cases A large text payload contrasts constant/template/ordinary parser cases. One accepted size does not certify a maximum limit or malformed request.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual plain HTTP body reading and generated text response decoding must preserve the full large payload; a direct string equality or stream unit cannot establish transport.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_api_plain_string = async (
  connection: api.IConnection,
): Promise<void> => {
  const x: string = RandomGenerator.alphabets(1_000_000);
  const y: string = await api.functional.plain.string(connection, x);
  TestValidator.equals("string", x, y);
};
