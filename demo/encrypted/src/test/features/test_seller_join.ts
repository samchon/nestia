import TSON from "typescript-json";
import api from "../../api";
import { ISeller } from "../../api/structures/ISeller";

export async function test_seller_join(
    connection: api.IConnection,
): Promise<void> {
    const seller: ISeller = await api.functional.sellers.authenticate.join(
        connection,
        {
            email: "someone@someone.com",
            name: "Someone",
            mobile: "01012345678",
            company: "Some Company",
            password: "qweqwe123!",
        },
    );
    TSON.assertType(seller);
}
