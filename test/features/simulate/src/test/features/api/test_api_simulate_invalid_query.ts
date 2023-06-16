import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import api from "@api";
import { IPage } from "@api/lib/structures/IPage";

export const test_api_simulate_invalid_query = (
    connection: api.IConnection
): Promise<void> => 
    TestValidator.httpError("invalid query")(400)(() =>
        api.functional.bbs.articles.query(
            connection,
            typia.random<Primitive<string>>(),
            {
                ...typia.random<Primitive<IPage.IRequest>>(),
                page: "1" as any as number,
            },
        ),
    );