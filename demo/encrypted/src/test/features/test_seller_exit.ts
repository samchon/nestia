import TSON from "typescript-json";
import api from "../../api";
import { ISeller } from "../../api/structures/ISeller";

export async function test_seller_exit(
    connection: api.IConnection,
): Promise<void> {
    const seller: ISeller = await api.functional.sellers.authenticate.login(
        connection,
        {
            email: "someone@someone.com",
            password: "qweqwe123!",
        },
    );
    TSON.assert(seller);

    await api.functional.sellers.authenticate.exit(connection);
}
