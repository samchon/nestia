import api from "../../../../api";

export const test_api_v1_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.v1.health.get(
        connection,
    );
};