import api from "../../../../api";

export const test_api_api_internal_v1_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.api.internal.v1.health.get(
        connection,
    );
};