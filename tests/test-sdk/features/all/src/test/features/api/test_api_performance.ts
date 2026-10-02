import typia from "typia";

import api from "@api";
import { IPerformance } from "@api/lib/structures/IPerformance";

/**
 * Verifies the generated performance request returns the authored performance
 * shape.
 *
 * The authored IPerformance DTO defines the independent structural expectation;
 * dynamic CPU and memory values are deliberately not pinned.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 */
export const test_api_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.performance.get(connection);
  typia.assert(performance);
};
