import api from "../../../../api";

export const test_api_common_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.common.health.get(
        connection,
    );
};