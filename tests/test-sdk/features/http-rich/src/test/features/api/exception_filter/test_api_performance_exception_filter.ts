import typia from "typia";

import api from "../../../../api";
import { ExceptionFilterIPerformance } from "../../../../structures/exception_filter/IPerformance";

/**
 * Verifies the generated performance request returns the authored performance
 * shape.
 *
 * The authored ExceptionFilterIPerformance DTO defines the independent
 * structural expectation; dynamic CPU and memory values are deliberately not
 * pinned.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated request proves the authored performance route returns its declared DTO. The same real compiled controller participates in the shared application.
 * @evidence contracts/testing.md#independent-expectations The request and expected result are unchanged from the original case: the independent handwritten performance DTO declares CPU, memory and resource members. The filter's handwritten literal message supplies the independent error marker.
 * @evidence contracts/testing.md#distinguishing-cases The successful request contrasts the five intentionally rejected requests; the generated result must pass the authored DTO predicate despite varying process statistics.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching exported function in the shared installed consumer. It awaits the actual generated request rather than starting another compiler or backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated client transport, Nest routing and the actual decorated controller must agree on the declared successful response. Direct native option units cannot establish this installed connection.
 * @evidence contracts/e2e.md#shared-execution The case shares one producer, generation, consumer and application with the other rich HTTP scenarios. It adds no installation, compiler context or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique exception_filter routes prevent identity collisions. Controllers and the filter are stateless; generated clients share only the connection and the owning runner closes the application.
 * @evidence contracts/e2e.md#preserved-coverage The original request arguments and awaited successful typia performance assertion are unchanged except reversible case/import/controller/DTO/route identities. Original absence of automatic E2E execution is preserved by the scenario execution policy.
 */
export const test_api_performance_exception_filter = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: ExceptionFilterIPerformance =
    await api.functional.http_rich.exception_filter.performance.get(connection);
  typia.assert(performance);
};
