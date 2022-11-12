import TSON from "typescript-json";
import api from "../../api";
import { Userspace } from "../../api/structures/Userspace";

export async function test_userspace_type1(
    connection: api.IConnection,
): Promise<void> {
    const data: Userspace.UserType1 = await api.functional.userspace.type1(
        connection,
    );
    TSON.assert(data);
}
