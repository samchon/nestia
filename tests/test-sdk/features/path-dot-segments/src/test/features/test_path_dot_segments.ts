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
 * @evidence contracts/testing.md#behavioral-verification The generated HTTP, simulation and WebSocket functions reject exact dot segments with the parameter error, while non-dot-segment values round-trip through HTTP and WebSocket on both adapters.
 * @evidence contracts/testing.md#independent-expectations URL dot-segment normalization makes . and .. unsuitable parameter segments; authored echo endpoints independently require the other values to be preserved.
 * @evidence contracts/testing.md#distinguishing-cases Both forbidden dot segments and ..., %2e, a/.., ../x and a.b cover adjacent allowed values; the simulator is checked for rejection only.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary Actual fetch URL handling and Express/Fastify routing must agree with generated HTTP and WebSocket path encoding, which direct string encoding cannot establish.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature supplies Express, this test owns its Fastify instance, and every successful WebSocket connection closes in finally. Fastify listen occurs before its try block, so startup failure cleanup remains a limitation.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
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
