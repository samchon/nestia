import api from "./../../../../api";

export const test_api_variable_$1234_number = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.variable.$1234.number(
        connection,
    );
};