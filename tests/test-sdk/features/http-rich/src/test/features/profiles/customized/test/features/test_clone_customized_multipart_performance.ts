import typia from "typia";

import { MultipartIPerformance } from "../../../../../../structures/customized/multipart/MultipartIPerformance";
import api from "../../api";

/**
 * Validates the generated consumer result.
 *
 * 1. Execute the original generated request against the actual multipart/profile
 *    handler.
 * 2. Require the original literal or source-type assertions below.
 *
 * @evidence contracts/testing.md#behavioral-verification The original actual performance response must match the independently authored CPU/memory/resource shape without pinning process measurements.
 * @evidence contracts/testing.md#independent-expectations The original authored CPU/memory/resource DTO defines the independent structural expectation; dynamic process measurements are not pinned.
 * @evidence contracts/testing.md#distinguishing-cases The original actual performance response must match the independently authored CPU/memory/resource shape without pinning process measurements.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs through DynamicExecutor in the shared compiled customized-profile consumer; this performance request uses its original source-type response assertion.
 * @evidence contracts/e2e.md#necessary-boundary The actual generated performance client must reach its transformed handler and return the independent source DTO shape across HTTP; it performs no upload or multipart decoding.
 * @evidence contracts/e2e.md#shared-execution Original SDK/Swagger settings match the existing customized graph. All multipart inputs join its same generation, producer, consumer and listener without automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private identities/routes isolate these stateless handlers. Disk uploads stay inside the owned compiled fixture, which the runner recreates before preparation; no shared workspace cache or retained decoded payload is used.
 * @evidence contracts/e2e.md#preserved-coverage Original literals, DTO assertions and controller byte/name checks remain. The identical outer ten-request loop is reduced to one complete payload; compile-only Blob/File schema and form-data calls remain in MultipartSchemaConnections.
 */
export const test_clone_customized_multipart_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: MultipartIPerformance =
    await api.functional.http_rich.options.customized.multipart_performance.get(
      connection,
    );
  typia.assert(performance);
};
