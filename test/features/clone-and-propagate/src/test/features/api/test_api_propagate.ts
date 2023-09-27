import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "@api";
import { IUser } from "@api/lib/structures/IUser";

export const test_api_propagate = async (
    connection: api.IConnection,
): Promise<void> => {
    const output: IPropagation<
        {
            202: IUser;
            404: "404 Not Found";
        },
        202
    > = await api.functional.users.user.getUserProfile(
        connection,
        "something",
        { user_type: "admin" },
    );
    typia.assertEquals(output);
};
