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
 * @evidence contracts/testing.md#behavioral-verification The generated request proves the authored void health route completes successfully. The same real compiled controller participates in the shared application.
 * @evidence contracts/testing.md#independent-expectations The request and expected result are unchanged from the original case: the authored health handler returns void. The filter's handwritten literal message supplies the independent error marker.
 * @evidence contracts/testing.md#distinguishing-cases The successful request contrasts the five intentionally rejected requests; the void outcome must complete without a transport exception.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching exported function in the shared installed consumer. It awaits the actual generated request rather than starting another compiler or backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated client transport, Nest routing and the actual decorated controller must agree on the declared successful response. Direct native option units cannot establish this installed connection.
 * @evidence contracts/e2e.md#shared-execution The case shares one producer, generation, consumer and application with the other rich HTTP scenarios. It adds no installation, compiler context or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique exception_filter routes prevent identity collisions. Controllers and the filter are stateless; generated clients share only the connection and the owning runner closes the application.
 * @evidence contracts/e2e.md#preserved-coverage The original request arguments and awaited successful void request are unchanged except reversible case/import/controller/DTO/route identities. Original absence of automatic E2E execution is preserved by the scenario execution policy.
 */
export const test_api_health_check_exception_filter = (
  connection: api.IConnection,
): Promise<void> =>
  api.functional.http_rich.exception_filter.health.get(connection);
