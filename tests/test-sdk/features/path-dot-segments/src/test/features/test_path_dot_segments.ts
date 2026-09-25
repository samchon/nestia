import { TestValidator } from "@nestia/e2e";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

import { Backend } from "../../Backend";
import api from "../../api";

/**
 * Verifies an SDK function refuses a path parameter that is a URL dot segment,
 * and sends every other value to its own route, on Express and Fastify, for
 * HTTP and WebSocket routes and the simulator.
 *
 * The path function encoded each parameter with `encodeURIComponent`, which
 * leaves `.` and `..` as they are, and the URL parser `fetch` uses resolved
 * them away: `..` reached the parent route `GET /dots`, and `.` arrived on
 * Fastify as `""` (#1714).
 *
 * 1. Assert `path(".")` and `path("..")` throw, naming the parameter, before any
 *    request, for the HTTP function, the WebSocket one, and the simulator.
 * 2. On both adapters, assert dot-bearing values that are no dot segment
 *    round-trip.
 */
export const test_path_dot_segments = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication = await Backend.fastify();
  await fastify.listen(0, "127.0.0.1");
  try {
    for (const [adapter, host] of [
      ["express", connection.host],
      ["fastify", (await fastify.getUrl()).replace("[::1]", "127.0.0.1")],
    ] as const) {
      for (const value of [".", ".."]) {
        await refused(`${adapter} http ${value}`, () =>
          api.functional.dots.at({ host }, value),
        );
        await refused(`${adapter} simulate ${value}`, () =>
          api.functional.dots.at({ host, simulate: true }, value),
        );
        await refused(`${adapter} websocket ${value}`, () =>
          api.functional.dots.socket({ host }, value, null),
        );
      }
      for (const value of ["...", "%2e", "a/..", "../x", "a.b"]) {
        TestValidator.equals(
          `${adapter} http ${value}`,
          await api.functional.dots.at({ host }, value),
          { value },
        );
        const { connector, driver } = await api.functional.dots.socket(
          { host },
          value,
          null,
        );
        try {
          TestValidator.equals(
            `${adapter} websocket ${value}`,
            await driver.echo(),
            value,
          );
        } finally {
          await connector.close();
        }
      }
    }
  } finally {
    await fastify.close();
  }
};

const refused = async (
  title: string,
  task: () => Promise<unknown>,
): Promise<void> => {
  const error: unknown = await task().then(
    () => null,
    (exp) => exp,
  );
  TestValidator.predicate(
    `${title} refused ${String(error)}`,
    error instanceof Error &&
      error.message.startsWith("Error on PathParameter.encode()") &&
      error.message.includes('"value"'),
  );
};
