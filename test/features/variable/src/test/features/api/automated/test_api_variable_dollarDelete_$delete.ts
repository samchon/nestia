import api from "./../../../../api";

export const test_api_variable_dollarDelete_$delete = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.variable.dollarDelete.$delete(
        connection,
    );
};