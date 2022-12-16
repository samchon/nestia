import typia from "typia";

import api from "../../api";
import { ICategory } from "../../api/structures/ICategory";

export async function test_category_at(
    connection: api.IConnection,
): Promise<void> {
    const category: ICategory =
        await api.functional.consumers.systematic.categories.at(connection, 0);
    typia.assert(category);
}
