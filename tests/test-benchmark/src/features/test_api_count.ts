import api from "../api";

/**
 * Supplies one HTTP event for each benchmark invocation.
 *
 * The suite counts events and endpoint groups against a known one-event
 * workload while measuring the simultaneous request ceiling at the server.
 *
 * 1. Invoke the paginated endpoint once with the servant's logging connection.
 * 2. Let the suite assert thirty events, endpoint totals and the four-request
 *    limit.
 */
export async function test_api_count(
  connection: api.IConnection,
): Promise<void> {
  await api.functional.bbs.articles.index(connection, "general", {
    limit: 1,
  });
}
