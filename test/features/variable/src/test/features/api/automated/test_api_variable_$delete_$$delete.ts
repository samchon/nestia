import api from "./../../../../api";

export const test_api_variable_$delete_$$delete = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.variable.$delete.$$delete(
        connection,
    );
};