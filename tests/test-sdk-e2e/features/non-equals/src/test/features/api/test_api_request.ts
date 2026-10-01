import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IRequestDto } from "@api/lib/structures/IRequestDto";

/**
 * Verifies api request through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification Ordinary a/b input must echo exactly, and an adjacent request with surplus:true must be accepted but return the exact declared a/b response without surplus.
 * @evidence contracts/testing.md#independent-expectations RequestController echoes its body under default non-equals validation; its declared IRequestDto response serializer emits only a/b. Literal inputs and exact output equality establish both expectations independently of a shape-only oracle.
 * @evidence contracts/testing.md#distinguishing-cases The surplus request now actually contains an extra key, contrasting ordinary input acceptance and declared-output projection. Installed assertEquals plus exact input equality reject a retained surplus or altered fields.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native body validator permissiveness, route serialization and generated HTTP client must connect; validating a local DTO cannot certify acceptance followed by response projection.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_api_request = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IRequestDto = { a: "a", b: "b" };
  const output: IRequestDto = await api.functional.request(connection, input);
  TestValidator.equals("DTO", input, output);

  const surplus: IRequestDto = await api.functional.request(connection, {
    ...input,
    surplus: true,
  } as IRequestDto);
  typia.assertEquals(surplus);
  TestValidator.equals("surplus omitted from response", surplus, input);
};
