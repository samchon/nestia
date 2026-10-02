import api from "../api";

/**
 * Supplies two HTTP events for one benchmark function invocation.
 *
 * The master must count completed invocations for progress while retaining both
 * request events for endpoint and duration statistics.
 *
 * 1. Invoke the same endpoint twice with the servant's logging connection.
 * 2. Let the suite entry assert event totals and progress independently.
 */
export const test_api_multiple_events = async (
  connection: api.IConnection,
): Promise<void> => {
  for (let i = 0; i < 2; ++i)
    await api.functional.bbs.articles.index(connection, "general", {
      limit: 1,
    });
};
