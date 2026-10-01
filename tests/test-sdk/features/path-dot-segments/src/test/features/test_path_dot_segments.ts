import { TestValidator } from "@nestia/e2e";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

import api from "@api";

import { Backend } from "../../Backend";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Both adapters must reject exact . and .. for generated HTTP/simulator/WebSocket calls with the named PathParameter error, while five other dot-bearing values roundtrip exactly over HTTP and WebSocket.
 * @evidence contracts/testing.md#independent-expectations URL dot segments must not redirect a parameterized request to a parent route. Authored echo handlers and handwritten accepted values establish exact returned values; the encode error must identify value independently of a network failure.
 * @evidence contracts/testing.md#distinguishing-cases Exact dot segments contrast .../%2e/a/../../x/a.b values, across HTTP/WebSocket/simulator and Express/Fastify. Simulator negatives are preflight only; accepted simulator values are not exercised here.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated path encoding and real URL parser/adapter routing must interoperate; encoding-string units cannot establish that fetch/WebSocket requests reach the intended handler.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_path_dot_segments = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication = await Backend.fastify();
  try {
    await fastify.listen(0, "127.0.0.1");
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
