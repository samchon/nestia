import api from "../../../../api";

export const test_api_operationId_custom = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.operationId.custom(
        connection,
    );
};