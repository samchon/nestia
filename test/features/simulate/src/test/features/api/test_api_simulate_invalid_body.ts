import { TestValidator } from "@nestia/e2e";
import typia, { Primitive } from "typia";

import api from "@api";
import type { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_simulate_invalid_body = (
    connection: api.IConnection
): Promise<void> => 
    TestValidator.httpError("invalid body")(400)(() =>
        api.functional.bbs.articles.store(
            connection,
            typia.random<Primitive<string>>(),
            {
                ...typia.random<Primitive<IBbsArticle.IStore>>(),
                title: 3 as any as string,
            },
        ),
    );