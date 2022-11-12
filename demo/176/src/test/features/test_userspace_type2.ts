import TSON from "typescript-json";
import api from "../../api";
import { Userspace } from "../../api/structures/Userspace";

export async function test_userspace_type2(
    connection: api.IConnection,
): Promise<void> {
    const data: Userspace.UserType2 = await api.functional.userspace.type2(
        connection,
    );
    TSON.assert(data);
}
