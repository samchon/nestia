import typia from "typia";

import api from "../../api";
import { ICategory } from "../../api/structures/ICategory";

export async function test_category_top(
    connection: api.IConnection,
): Promise<void> {
    const categories: ICategory[] =
        await api.functional.consumers.systematic.categories.top(connection);
    typia.assert(categories);
}
