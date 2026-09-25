import api from "@api";

export const test_api_health_check = (
  connection: api.IConnection,
): Promise<void> => api.functional.param_validate.health.get(connection);
