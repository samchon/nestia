import api from "../../../../api";

/**
 * Verifies the generated void health request resolves without a transport or
 * status error.
 *
 * The authored health controller returns void; the generated client must
 * complete its request successfully. This smoke case does not prove validation
 * or serialization.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated void health request must complete against its authored scenario controller; a transport or status failure rejects the case.
 * @evidence contracts/testing.md#independent-expectations The authored controller returns void and the original case requires request completion; it makes no assertion about validation or serialization.
 * @evidence contracts/testing.md#distinguishing-cases This minimal successful void connection complements DTO shape and malformed request checks elsewhere in the shared population.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from date/src/test/features/api/test_api_health_check.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_health_check_date = (
  connection: api.IConnection,
): Promise<void> => api.functional.http_rich.date.health.get(connection);
