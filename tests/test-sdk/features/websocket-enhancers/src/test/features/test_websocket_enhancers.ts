import { TestValidator } from "@nestia/e2e";
import { INestApplication } from "@nestjs/common";
import { createRequire } from "module";
import { WebSocketConnector, WebSocketError } from "tgrid";

import api from "@api";
import { IEcho } from "@api/lib/structures/IEcho";

import { Backend } from "../../Backend";
import { INTERCEPTED } from "../../controllers/EnhancedController";

/**
 * Verifies a WebSocket route passes the enhancers NestJS applies to the same
 * controller method, with the upgrade request as the HTTP execution context,
 * and a request-scoped controller or guard is built for each connection, on
 * Express and on Fastify.
 *
 * `WebSocketAdaptor` called the method directly on the static instance, so a
 * guarded controller served its WebSocket routes to anyone, no interceptor or
 * exception filter ran, and a request-scoped controller had nothing injected
 * (#1709).
 *
 * 1. Connect to routes guarded by a deny guard on the controller and on the
 *    method, an allow guard, no guard, a guard reading `Authorization`, a
 *    request-scoped guard, and a global `APP_GUARD`; assert the denied ones are
 *    rejected with 1008 while the HTTP routes answer 403.
 * 2. Assert a guard runs before the handshake's validation.
 * 3. Assert an interceptor wraps the handler, a filter's mapped exception is the
 *    rejection, a filter returning a value or an interceptor skipping the
 *    handler still ends the handshake, and a request-scoped controller receives
 *    the upgrade request.
 */
export const test_websocket_enhancers = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: INestApplication = await Backend.fastify();
  await fastify.listen(0, "127.0.0.1");
  try {
    for (const [adapter, host] of [
      ["express", connection.host],
      ["fastify", (await fastify.getUrl()).replace("[::1]", "127.0.0.1")],
    ] as const)
      await validate(adapter, host);
  } finally {
    await fastify.close();
  }
};

const validate = async (adapter: string, host: string): Promise<void> => {
  const ws: string = host.replace("http", "ws");
  const served = async (path: string): Promise<string> => {
    const connector = new WebSocketConnector<undefined, null, IEcho>(
      undefined,
      null,
    );
    await connector.connect(`${ws}${path}`);
    try {
      return await connector.getDriver().echo();
    } finally {
      await connector.close();
    }
  };
  const rejected = async (
    title: string,
    path: string,
    status: number,
    reason: string,
  ): Promise<void> => {
    const error: unknown = await served(path).then(
      () => null,
      (e) => e,
    );
    TestValidator.predicate(
      `${adapter} ${title} rejected ${String(error)}`,
      error instanceof WebSocketError &&
        error.status === status &&
        error.message === reason,
    );
  };

  // guards
  TestValidator.equals(
    `${adapter} guarded http`,
    (await fetch(`${host}/guarded`)).status,
    403,
  );
  TestValidator.equals(
    `${adapter} denied http`,
    (await fetch(`${host}/enhanced/denied`)).status,
    403,
  );
  await rejected("controller guard", "/guarded", 1008, "Forbidden resource");
  await rejected(
    "method guard",
    "/enhanced/denied?value=1",
    1008,
    "Forbidden resource",
  );
  TestValidator.equals(
    `${adapter} allow guard`,
    await served("/enhanced/allowed"),
    "allowed",
  );
  TestValidator.equals(
    `${adapter} no guard`,
    await served("/enhanced/open"),
    "open",
  );
  await rejected(
    "global guard",
    "/enhanced/open?deny=1",
    1008,
    "Forbidden resource",
  );
  await rejected(
    "request-scoped guard",
    "/enhanced/scoped-guard",
    1008,
    "Forbidden resource",
  );
  TestValidator.equals(
    `${adapter} request-scoped guard passing`,
    await served("/enhanced/scoped-guard?pass=1"),
    "scoped-guard",
  );
  TestValidator.equals(
    `${adapter} bearer missing`,
    await handshake(`${ws}/enhanced/bearer`, {}),
    "1008 bearer token required",
  );
  TestValidator.equals(
    `${adapter} bearer`,
    await handshake(`${ws}/enhanced/bearer`, {
      authorization: "Bearer secret",
    }),
    "accepted",
  );

  // a guard runs before the handshake's validation
  await rejected(
    "guard before validation",
    "/enhanced/denied?value=abc",
    1008,
    "Forbidden resource",
  );

  // interceptors, filters, and request scope
  INTERCEPTED.splice(0, INTERCEPTED.length);
  TestValidator.equals(
    `${adapter} interceptor`,
    await served("/enhanced/intercepted"),
    "intercepted",
  );
  TestValidator.equals(`${adapter} interceptor order`, INTERCEPTED, [
    "before intercepted",
    "handler",
    "after",
  ]);
  await rejected(
    "mapping filter",
    "/enhanced/filtered",
    1008,
    "mapped: domain",
  );
  // a pipeline that returns without the handler having run still ends it
  await rejected(
    "filter returning a value",
    "/enhanced/swallowed",
    1008,
    "the WebSocket route did not handle the connection",
  );
  await rejected(
    "interceptor skipping the handler",
    "/enhanced/short-circuited",
    1008,
    "the WebSocket route did not handle the connection",
  );
  TestValidator.equals(
    `${adapter} request-scoped controller`,
    await served("/scoped?name=nestia"),
    "request nestia",
  );
};

/**
 * The outcome of tgrid's handshake over a socket sending its own upgrade
 * headers, which tgrid's connector cannot: `accepted`, or the close code and
 * reason.
 */
const handshake = (
  url: string,
  headers: Record<string, string>,
): Promise<string> =>
  new Promise((resolve, reject) => {
    // the `ws` package @nestia/core itself serves WebSocket routes with
    const WebSocket = createRequire(require.resolve("@nestia/core"))("ws");
    const socket = new WebSocket(url, { headers });
    socket.on("open", () => socket.send(JSON.stringify({ header: undefined })));
    socket.on("message", (data: Buffer) => {
      if (data.toString() === "1") {
        socket.close();
        resolve("accepted");
      }
    });
    socket.on("close", (code: number, reason: Buffer | string) =>
      resolve(`${code} ${reason.toString()}`),
    );
    socket.on("error", reject);
  });
