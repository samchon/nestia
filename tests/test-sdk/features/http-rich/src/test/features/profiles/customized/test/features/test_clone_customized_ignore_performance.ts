import typia from "typia";

import { IgnoreIPerformance } from "../../../../../../structures/customized/ignore/IgnoreIPerformance";
import api from "../../api";

/**
 * Verifies the generated performance request returns the authored performance
 * shape.
 *
 * The authored IgnoreIPerformance DTO defines the independent structural
 * expectation; dynamic CPU and memory values are deliberately not pinned.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The original response must satisfy the authored CPU/memory/resource DTO; changing process measurements remain unpinned.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases The original response must satisfy the authored CPU/memory/resource DTO; changing process measurements remain unpinned.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The actual generated performance client must reach its transformed handler and return the source DTO shape across the HTTP boundary.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed.
 */
export const test_clone_customized_ignore_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IgnoreIPerformance =
    await api.functional.http_rich.options.customized.ignore_performance.get(
      connection,
    );
  typia.assert(performance);
};
