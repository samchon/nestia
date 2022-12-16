import typia from "typia";

import api from "../../api";
import { ISeller } from "../../api/structures/ISeller";

export async function test_seller_password_change(
    connection: api.IConnection,
): Promise<void> {
    const seller: ISeller = await api.functional.sellers.authenticate.login(
        connection,
        {
            email: "someone@someone.com",
            password: "qweqwe123!",
        },
    );
    typia.assert(seller);

    await api.functional.sellers.authenticate.exit(connection);
}
