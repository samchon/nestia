import api from "@api";

export const test_api_monitor_health_check = (
  connection: api.IConnection,
): Promise<void> => api.functional.operationId.health.get(connection);
