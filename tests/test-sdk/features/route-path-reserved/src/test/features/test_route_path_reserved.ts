import { TestValidator } from "@nestia/e2e";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import fs from "fs";

import api from "@api";

import { Backend } from "../../Backend";

/**
 * Verifies a route whose literal text holds a character the router reserves
 * reaches its handler through the SDK, and the Swagger document writes the
 * literal, on Express (`\:`) and Fastify (`::`), for HTTP and WebSocket
 * routes.
 *
 * `PathAnalyzer` treated a route as a file path, so the router's escape `\:`
 * became a separator and `items\:batchGet` a parameter `batchGet`, failing
 * `nestia sdk`; and `WebSocketAdaptor` matched with `path-parser`, which cannot
 * read an escape (#1713).
 *
 * 1. Call each Express route and its Fastify twin through the SDK and its
 *    simulator.
 * 2. Connect to the WebSocket route of each.
 * 3. Assert the Swagger paths hold the unescaped literal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Express escaped literal paths, their Fastify batchGet twin and both WebSockets; checks echo results, simulator shape and generated Swagger paths.
 * @evidence contracts/testing.md#independent-expectations Literal router escape spellings must reach the authored controller responses and become unescaped protocol paths in Swagger.
 * @evidence contracts/testing.md#distinguishing-cases Escaped colon, parentheses, parameter-adjacent literals, simulation and both HTTP adapters distinguish route text from native filesystem parsing; WebSocket connections add their own matching boundary.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route-path-reserved/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route-path-reserved fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data. The additional Fastify application closes in finally and each WebSocket connector closes after echo.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Escaped colon, parentheses, parameter-adjacent literals, simulation and both HTTP adapters distinguish route text from native filesystem parsing; WebSocket connections add their own matching boundary.
 */
export const test_route_path_reserved = async (
  connection: api.IConnection,
): Promise<void> => {
  // Express: path-to-regexp's escapes
  const express = api.functional.express;
  TestValidator.equals(
    "express batchGet",
    await express.items__batchGet.batchGet(connection),
    { route: "batchGet" },
  );
  TestValidator.equals(
    "express cancel",
    await express.items.cancel(connection, "7"),
    { route: "cancel", id: "7" },
  );
  TestValidator.equals(
    "express paren",
    await express.a__b.paren(connection, "x"),
    { route: "paren", id: "x" },
  );
  TestValidator.equals(
    "express websocket",
    await echo(() => express.room__join.join({ host: connection.host }, null)),
    "join",
  );
  const simulated = await express.items.cancel(
    { ...connection, simulate: true },
    "7",
  );
  TestValidator.equals("express simulate", typeof simulated.route, "string");

  // Fastify: find-my-way's `::`
  const app: NestFastifyApplication = await Backend.fastify();
  await app.listen(0, "127.0.0.1");
  try {
    const host: string = (await app.getUrl()).replace("[::1]", "127.0.0.1");
    TestValidator.equals(
      "fastify batchGet",
      await api.functional.fastify.items__batchGet.batchGet({ host }),
      { route: "batchGet" },
    );
    TestValidator.equals(
      "fastify websocket",
      await echo(() => api.functional.fastify.room__join.join({ host }, null)),
      "join",
    );
  } finally {
    await app.close();
  }

  // the document writes the literal as a client sends it
  const paths: string[] = Object.keys(
    JSON.parse(fs.readFileSync(`${__dirname}/../../../swagger.json`, "utf8"))
      .paths,
  ).sort();
  TestValidator.equals("swagger paths", paths, [
    "/express/a(b/{id}*",
    "/express/items/{id}:cancel",
    "/express/items:batchGet",
    "/fastify/items:batchGet",
  ]);
};

const echo = async (
  connect: () => Promise<{
    connector: { close(): Promise<void> };
    driver: { echo(): Promise<string> };
  }>,
): Promise<string> => {
  const { connector, driver } = await connect();
  try {
    return await driver.echo();
  } finally {
    await connector.close();
  }
};
