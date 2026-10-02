import { TestValidator } from "@nestia/e2e";

import api from "./../../../api";

/**
 * Validates the generated consumer result.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that HEAD client returns undefined.
 * @evidence contracts/testing.md#independent-expectations Expectations come from HTTP HEAD responses carry no body, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns bodyless method beside typed GET.
 * @evidence contracts/testing.md#execution-ownership The method fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The method runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the method fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted bodyless method beside typed GET distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_method_head = async (
  connection: api.IConnection,
): Promise<void> => {
  const x = await api.functional.method.head(connection);
  TestValidator.equals("HEAD has no response body", x, undefined);
};
