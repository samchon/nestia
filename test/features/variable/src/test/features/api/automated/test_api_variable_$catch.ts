import api from "./../../../../api";

export const test_api_variable_$catch = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.variable.$catch(
        connection,
    );
};