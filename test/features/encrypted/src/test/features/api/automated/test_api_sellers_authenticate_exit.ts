import api from "../../../../api";

export const test_api_sellers_authenticate_exit = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.sellers.authenticate.exit(
        connection,
    );
};