import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import api from "@api";

export const test_api_simulate_invalid_uuid = (
    connection: api.IConnection
): Promise<void> => 
    TestValidator.httpError("invalid uuid")(400)(() => 
        api.functional.bbs.articles.at(
            connection,
            typia.random<Primitive<string>>(),
            typia.random<Primitive<string>>(),
        ),
    );