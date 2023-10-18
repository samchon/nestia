import api from "../../../../api";

export const test_api_api_v3_common_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.api.v3.common.health.get(
        connection,
    );
};