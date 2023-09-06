import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { _singlequote_process_singlequote_ } from "../../../../api/structures/_singlequote_process_singlequote_";

export const test_api_performance_resource = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<_singlequote_process_singlequote_.global.NodeJS.ResourceUsage> = 
        await api.functional.performance.resource(
            connection,
        );
    typia.assert(output);
};