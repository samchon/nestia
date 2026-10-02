import typia from "typia";

import api from "@api";
import { IPerformance } from "@api/lib/structures/IPerformance";

/**
 * Validates the generated consumer result.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that performance GET passes IPerformance validation.
 * @evidence contracts/testing.md#independent-expectations Expectations come from the independently declared response DTO, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns valid CPU/memory/resource objects under this fixture's generator options.
 * @evidence contracts/testing.md#execution-ownership The multipart-form-data fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The multipart-form-data runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the multipart-form-data fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted valid CPU/memory/resource objects under this fixture's generator options distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.performance.get(connection);
  typia.assert(performance);
};
