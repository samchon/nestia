import api from "../../api";

export async function test_health_checks(
    connection: api.IConnection,
): Promise<void> {
    await api.functional.health.check(connection);
    await api.functional.health.alive.check(connection);
    await api.functional.healthy.check(connection);
    await api.functional.healthy.alive.check(connection);
}
