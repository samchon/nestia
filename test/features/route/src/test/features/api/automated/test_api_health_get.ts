import api from "../../../../api";

export const test_api_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.health.get(
        connection,
    );
};