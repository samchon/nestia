import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import path from "node:path";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Original dot-segment refusal and nonsegment echo assertions execute over actual Express and Fastify HTTP/WebSocket plus simulator calls; each connection closes.
 * @evidence contracts/testing.md#independent-expectations URL dot-segment normalization makes literal dots unsafe; authored nonsegment values and named-parameter errors define the independent expected refusal and round-trip results.
 * @evidence contracts/testing.md#distinguishing-cases Both dot and double-dot are refused before request, while five dot-bearing nonsegments echo for HTTP/WebSocket on both adapters; explicit simulation keeps its original negative controls.
 * @evidence contracts/testing.md#execution-ownership This matching shared consumer file/export retains actual native controller generation, current emitted SDK and consumer compilation before execution; the canonical SDK integration discovers its original operations and private helpers.
 * @evidence contracts/e2e.md#necessary-boundary Native HTTP/WebSocket routes, generated path encoding and actual Express/Fastify transport must agree, including pre-request rejection and simulator behavior.
 * @evidence contracts/e2e.md#shared-execution Both original owners have identical generation options and share one combined graph, default producer, installation and consumer compilation. The existing Express listener and one necessary Fastify listener reuse the same emitted inputs without another compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route/declaration identities separate the two graphs; local authored response streams or connection handles retain their original lifetime. Fastify uses an OS-assigned port and closes in finally; shared Express belongs to runner teardown.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs, assertion/helper bodies and imports remain after private identity and artifact-address rebasing. The original Fastify factory mounts already compiled controllers; listen failure now joins finally-owned cleanup. Original simulate:true generation remains, without forcing transport cases into simulated execution.
 */
export const test_clone_socket_dot_segments = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication = await createFastify();
  try {
    await fastify.listen(0, "127.0.0.1");
    for (const [adapter, host] of [
      ["express", connection.host],
      ["fastify", (await fastify.getUrl()).replace("[::1]", "127.0.0.1")],
    ] as const) {
      for (const value of [".", ".."]) {
        await refused(`${adapter} http ${value}`, () =>
          api.functional.http_rich.options.stream_dot_paths.dots.at(
            { host },
            value,
          ),
        );
        await refused(`${adapter} simulate ${value}`, () =>
          api.functional.http_rich.options.stream_dot_paths.dots.at(
            { host, simulate: true },
            value,
          ),
        );
        await refused(`${adapter} websocket ${value}`, () =>
          api.functional.http_rich.options.stream_dot_paths.dots.socket(
            { host },
            value,
            null,
          ),
        );
      }
      for (const value of ["...", "%2e", "a/..", "../x", "a.b"]) {
        TestValidator.equals(
          `${adapter} http ${value}`,
          await api.functional.http_rich.options.stream_dot_paths.dots.at(
            { host },
            value,
          ),
          { value },
        );
        const { connector, driver } =
          await api.functional.http_rich.options.stream_dot_paths.dots.socket(
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

const createFastify = async (): Promise<NestFastifyApplication> => {
  const app: NestFastifyApplication =
    await NestFactory.create<NestFastifyApplication>(
      await core.DynamicModule.mount(
        path.join(
          __dirname,
          "../../../../../../../producer/controllers/options/stream_dot_paths",
        ),
      ),
      new FastifyAdapter(),
      { logger: false },
    );
  try {
    await core.WebSocketAdaptor.upgrade(app);
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
};
