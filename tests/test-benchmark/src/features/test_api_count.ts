import api from "../api";

export async function test_api_count(
  connection: api.IConnection,
): Promise<void> {
  await api.functional.bbs.articles.index(connection, "general", {
    limit: 1,
  });
}
