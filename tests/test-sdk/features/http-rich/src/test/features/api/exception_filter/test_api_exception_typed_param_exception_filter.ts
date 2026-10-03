import api from "../../../../api";
import { validate_rich_exception_filter } from "../../internal/validate_rich_exception_filter";

/**
 * Verifies malformed UUID path parameter retains status 400 and the custom
 * filter message.
 *
 * The original exception-filter fixture needs actual Nest/client execution to
 * distinguish interception from an ordinary error response. Shared preparation
 * retains that connection without another independent project or server.
 *
 * 1. Send the original request through the freshly generated client.
 * 2. Require the original status and custom filter marker.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated request proves malformed UUID path parameter retains status 400 and the custom filter message. The same real compiled controller participates in the shared application.
 * @evidence contracts/testing.md#independent-expectations The request and expected result are unchanged from the original case: the authored UUID path type rejects abcd. The filter's handwritten literal message supplies the independent error marker.
 * @evidence contracts/testing.md#distinguishing-cases Status and custom message must both match, and a successful request cannot satisfy the expected error. The sibling cases distinguish framework/manual errors and body/path/query rejection.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching exported function in the shared installed consumer. It awaits the actual generated request rather than starting another compiler or backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated client transport, Nest routing and the actual decorated controller must preserve UseFilters interception and the response body. Direct native option units cannot establish this installed connection.
 * @evidence contracts/e2e.md#shared-execution The case shares one producer, generation, consumer and application with the other rich HTTP scenarios. It adds no installation, compiler context or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique exception_filter routes prevent identity collisions. Controllers and the filter are stateless; generated clients share only the connection and the owning runner closes the application.
 * @evidence contracts/e2e.md#preserved-coverage The original request arguments and awaited status/custom-message error assertions are unchanged except reversible case/import/controller/DTO/route identities. Original absence of automatic E2E execution is preserved by the scenario execution policy.
 */
export const test_api_exception_typed_param_exception_filter = (
  connection: api.IConnection,
): Promise<void> =>
  validate_rich_exception_filter(400)((connection) =>
    api.functional.http_rich.exception_filter.exception.typedParam(
      connection,
      "abcd",
    ),
  )(connection);
