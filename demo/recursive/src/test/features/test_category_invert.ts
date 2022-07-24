import api from "../../api";
import { ICategory } from "../../api/structures/ICategory";
import TSON from "typescript-json";

export async function test_category_invert(
    connection: api.IConnection,
): Promise<void> {
    const category: ICategory.IInvert =
        await api.functional.consumers.systematic.categories.invert(
            connection,
            0,
        );
    TSON.assertType(category);
}
