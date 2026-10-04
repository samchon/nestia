import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification The original void health request must resolve without transport or status failure; it does not establish serialization or validation.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases The original void health request must resolve without transport or status failure; it does not establish serialization or validation.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The actual generated void client, fetcher and health handler must agree on path, method and response status; this is a transport connection, not a serialization assertion.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed.
 */
export const test_clone_customized_ignore_health = (
  connection: api.IConnection,
): Promise<void> =>
  api.functional.http_rich.options.customized.ignore_health.get(connection);
