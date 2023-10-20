import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { process } from "../../../../api/structures/process";

export const test_api_performance_resource = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: process.global.NodeJS.ResourceUsage;
    }> = await api.functional.performance.resource(
        connection,
    );
    typia.assert(output);
};