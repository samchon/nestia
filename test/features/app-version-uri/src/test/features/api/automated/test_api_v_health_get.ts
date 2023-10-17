import api from "../../../../api";

export const test_api_v_health_get = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.v.health.get(
        connection,
    );
};