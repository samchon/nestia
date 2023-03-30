import typia from "typia";

import { TestValidator } from "../../TestValidator";
import { IBbsArticle } from "./structures/IBbsArticle";
import { IPage } from "./structures/IPage";

export function test_validate_equals(): void {
    const original: IPage<IBbsArticle.ISummary> = (() => {
        while (true) {
            const page = typia.random<IPage<IBbsArticle.ISummary>>();
            if (page.data.length) return page;
        }
    })();
    const replica: IPage<IBbsArticle.ISummary> = JSON.parse(
        JSON.stringify(original),
    );

    // SAME
    TestValidator.equals("same")(original)(replica);

    // DIFFERENT
    replica.data[0].title += " -> to be different";
    TestValidator.error("different")(() =>
        TestValidator.equals("")(original)(replica),
    );
}
