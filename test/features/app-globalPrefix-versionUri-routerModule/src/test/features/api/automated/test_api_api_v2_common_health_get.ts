import api from "../../../../api";

export const test_api_api_v2_common_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.api.v2.common.health.get(
        connection,
    );
};