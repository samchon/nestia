import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import path from "node:path";
import { WebSocketConnector, WebSocketError } from "tgrid";

import { ISocketRejection } from "../../../../../../structures/options/socket_rejection/ISocketRejection";
import api from "../../api";

const CONTROLLERS = path.join(
  __dirname,
  "../../../../../../../producer/controllers/options/socket_rejection",
);
const { OVERSIZED } = require(
  path.join(CONTROLLERS, "SocketRejectionController.js"),
) as { OVERSIZED: string };

/**
 * Verifies every failing WebSocket request ends promptly with a close code and
 * a reason, on Express and on Fastify.
 *
 * The adaptor rejected an invalid handshake with the JSON of the whole
 * exception, which exceeds the 123 bytes a close reason holds, so `ws` threw
 * and the client waited forever; a route throwing before `accept()` was never
 * rejected; one throwing after it was never closed (#1704).
 *
 * 1. On the harness's Express application and on a Fastify one, open each route
 *    through tgrid's connector: an invalid param, header, and query; no route;
 *    a throw before `accept()`, an `HttpException`, an oversized message, and a
 *    throw after `accept()`.
 * 2. Assert each settles within the deadline with its code and its reason, cut to
 *    123 bytes at a character boundary.
 * 3. Assert a valid handshake still serves, and the SDK sees the same rejection.
 *
 * @evidence contracts/testing.md#behavioral-verification Every original handshake rejection, before/after-accept exception, UTF-8 close-reason limit, pending RPC, valid echo and SDK rejection is asserted on both actual Express and Fastify listeners with the original deadline.
 * @evidence contracts/testing.md#independent-expectations Authored close codes, literal messages and the 123-byte WebSocket reason limit define the expected results independently of adaptor output; the valid UUID/header/query fixes the positive echo expectation.
 * @evidence contracts/testing.md#distinguishing-cases Invalid UUID/header/query, nonexistent route, ordinary and HTTP exceptions before acceptance, a multibyte oversized reason and pending RPC after acceptance contrast with the valid handshake on each HTTP adapter.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export executes current native producer routes through actual raw connectors and generated SDK; the canonical SDK integration discovers it after shared generation and compilation.
 * @evidence contracts/e2e.md#necessary-boundary Native validation, WebSocket handshake/error transport, pending RPC and generated SDK must agree on both Express and Fastify. Direct rule units cannot prove settlement, close reason or adapter assembly.
 * @evidence contracts/e2e.md#shared-execution The case reuses the installed graph, default producer, shared consumer and Express listener; one Fastify listener is necessary for its distinct adapter. Both mount the same already emitted controller without recompilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route/type identities isolate the stateless rejection graph. Each connector retains its original close or deadline termination; the Fastify listener closes in finally even if upgrade or listen fails, and runner teardown owns Express.
 * @evidence contracts/e2e.md#preserved-coverage Both original inputs and the whole case/helper assertions remain. Only private identities, generated import bindings and emitted producer addresses change; original SDK/Swagger settings retain no automatic E2E generation.
 */
export const test_clone_socket_rejection = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication =
    await NestFactory.create<NestFastifyApplication>(
      await core.DynamicModule.mount(CONTROLLERS),
      new FastifyAdapter(),
      { logger: false },
    );
  try {
    await core.WebSocketAdaptor.upgrade(fastify);
    await fastify.listen(0, "127.0.0.1");
    for (const [adapter, host] of [
      ["express", connection.host.replace("http", "ws")],
      ["fastify", (await url(fastify)).replace("http", "ws")],
    ] as const)
      await validate(adapter, host);
  } finally {
    await fastify.close();
  }
};

const validate = async (adapter: string, host: string): Promise<void> => {
  const header: ISocketRejection.IHeader = { name: "nestia" };
  const expect = async (
    title: string,
    props: {
      path: string;
      header: object | undefined;
      status: number;
      reason: string | ((reason: string) => boolean);
    },
  ): Promise<void> => {
    const connector = new WebSocketConnector<object | undefined, null, any>(
      props.header,
      null,
    );
    const error: WebSocketError = await failure(
      `${adapter} ${title}`,
      connector,
      async () => {
        await connector.connect(`${host}${props.path}`);
        await connector.close();
      },
    );
    TestValidator.equals(
      `${adapter} ${title} status`,
      error.status,
      props.status,
    );
    TestValidator.predicate(
      `${adapter} ${title} reason ${JSON.stringify(error.message)}`,
      typeof props.reason === "string"
        ? error.message === props.reason
        : props.reason(error.message),
    );
    TestValidator.predicate(
      `${adapter} ${title} reason bytes`,
      Buffer.byteLength(error.message, "utf8") <= 123,
    );
  };

  const uuid: string = "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69";
  await expect("param", {
    path: `/http_rich/options/socket_rejection/validate/not-a-uuid?count=1`,
    header,
    status: 1003,
    reason: (reason) => reason.length !== 0,
  });
  await expect("header", {
    path: `/http_rich/options/socket_rejection/validate/${uuid}?count=1`,
    header: { name: 3 },
    status: 1003,
    reason: (reason) => reason.includes("$input.name"),
  });
  await expect("query", {
    path: `/http_rich/options/socket_rejection/validate/${uuid}?count=abc`,
    header,
    status: 1003,
    reason: (reason) => reason.includes("count"),
  });
  await expect("no route", {
    path: `/http_rich/options/socket_rejection/nowhere`,
    header: undefined,
    status: 1002,
    reason: "WebSocket API not found",
  });
  await expect("before accept", {
    path: `/http_rich/options/socket_rejection/before`,
    header: undefined,
    status: 1008,
    reason: "thrown before accept",
  });
  await expect("http exception", {
    path: `/http_rich/options/socket_rejection/forbidden`,
    header: undefined,
    status: 1008,
    reason: "no entry",
  });
  await expect("oversized", {
    path: `/http_rich/options/socket_rejection/oversized`,
    header: undefined,
    status: 1008,
    reason: OVERSIZED.slice(0, 41), // "a" and 40 of the 3-byte "가": 121 bytes
  });

  // accepted, then thrown: the pending call ends with the close
  const connector = new WebSocketConnector<
    undefined,
    null,
    ISocketRejection.IProvider
  >(undefined, null);
  await connector.connect(`${host}/http_rich/options/socket_rejection/after`);
  const pending: Promise<void> = connector.getDriver().hang();
  await connector.getDriver().trigger();
  const closed: WebSocketError = await failure(
    `${adapter} after accept`,
    connector,
    () => pending,
  );
  TestValidator.equals(`${adapter} after accept status`, closed.status, 1011);
  TestValidator.equals(
    `${adapter} after accept reason`,
    closed.message,
    "thrown after accept",
  );

  // a valid handshake still serves
  const valid = new WebSocketConnector<
    ISocketRejection.IHeader,
    null,
    ISocketRejection.IProvider
  >(header, null);
  await valid.connect(
    `${host}/http_rich/options/socket_rejection/validate/${uuid}?count=2`,
  );
  try {
    TestValidator.equals(
      `${adapter} valid`,
      await valid.getDriver().echo("x"),
      `${uuid}:nestia:2:x`,
    );
  } finally {
    await valid.close();
  }

  // and the SDK sees the same rejection
  const sdk: WebSocketError = await failure(`${adapter} sdk`, null, () =>
    api.functional.http_rich.options.socket_rejection.before(
      { host: host.replace("ws", "http") },
      null,
    ),
  );
  TestValidator.equals(`${adapter} sdk status`, sdk.status, 1008);
  TestValidator.equals(
    `${adapter} sdk reason`,
    sdk.message,
    "thrown before accept",
  );
};

/**
 * The `WebSocketError` a task rejects with, failing if it settles without one
 * or is still pending after the deadline. A pending connection is dropped, as
 * the application cannot close while a socket stays open.
 */
const failure = async (
  title: string,
  connector: WebSocketConnector<any, any, any> | null,
  task: () => Promise<unknown>,
): Promise<WebSocketError> => {
  let timer: NodeJS.Timeout | undefined;
  const outcome: unknown = await Promise.race([
    task().then(
      () => new Error(`${title}: settled without an error`),
      (error) => error,
    ),
    new Promise<Error>((resolve) => {
      timer = setTimeout(() => {
        const socket: any = (connector as any)?.socket_;
        if (typeof socket?.terminate === "function") socket.terminate();
        else socket?.close?.();
        resolve(new Error(`${title}: still pending after 5 seconds`));
      }, 5_000);
    }),
  ]);
  clearTimeout(timer);
  if (outcome instanceof WebSocketError) return outcome;
  throw outcome instanceof Error ? outcome : new Error(`${title}: ${outcome}`);
};

const url = async (app: INestApplication): Promise<string> =>
  (await app.getUrl()).replace("[::1]", "127.0.0.1");
