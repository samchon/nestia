import { RandomGenerator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

export const test_api_encrypted_long = async (
    connection: api.IConnection,
): Promise<void> => {
    const seller: ISeller = await api.functional.sellers.authenticate.join(
        connection,
        {
            email: "someone@someone.com",
            name: "Someone",
            mobile: "01012345678",
            company: RandomGenerator.alphabets(500_000),
            password: "qweqwe123!",
        },
    );
    typia.assert(seller);
};
