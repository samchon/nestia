import typia from "typia";

import { IAllMethodPerformance } from "../../../../../../structures/options/all_method/IAllMethodPerformance";
import api from "../../api";

/**
 * Verifies the generated performance request returns the authored performance
 * shape.
 *
 * The authored IAllMethodPerformance DTO defines the independent structural
 * expectation; dynamic CPU and memory values are deliberately not pinned.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated performance GET returns a value accepted by typia.assert against the original authored CPU/memory/resource DTO.
 * @evidence contracts/testing.md#independent-expectations Authored NodeJS.CpuUsage, MemoryUsage and ResourceUsage define structure; live numerical values are intentionally variable.
 * @evidence contracts/testing.md#distinguishing-cases The actual performance response is structurally checked, whereas the separate health case has no body; no generated snapshot defines the expected DTO.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary Native All/health/performance metadata, generated clients and actual requests must agree; authored response assertions provide the independent schema check.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Only genuinely different native request validation or response serialization options have distinct producer programs; same-option inputs reuse them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and option configurations remain, with only private identities and artifact/source addresses rebased. All-method article plus health/performance generated tests retain their enabled execution alongside both original authored cases.
 */
export const test_clone_all_method_api_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IAllMethodPerformance =
    await api.functional.http_rich.options.all_method.performance.get(
      connection,
    );
  typia.assert(performance);
};
