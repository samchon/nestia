import api from "../../../../api";

export const test_api_method_head = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.method.head(
        connection,
    );
};