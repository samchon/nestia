import api from "@api";
import { IRequestDto } from "@api/lib/structures/IRequestDto";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_api_request = async (
    connection: api.IConnection,
): Promise<void> => {
    const input: IRequestDto = { a: "a", b: "b" };
    const output: IRequestDto = await api.functional.request(connection, input);
    TestValidator.equals("DTO")(input)(output);

    const surplus = { ...input, c: "c" };
    TestValidator.error("surplus")(() =>
        typia.assertEquals<IRequestDto>(surplus),
    );
    TestValidator.error("surplus")(() =>
        api.functional.request(connection, surplus),
    );
};
