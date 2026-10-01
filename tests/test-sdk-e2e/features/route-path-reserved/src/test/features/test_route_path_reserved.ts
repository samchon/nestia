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
 * @evidence contracts/testing.md#behavioral-verification Generated Express literal colon/cancel/paren HTTP paths and WebSocket join must return exact authored payloads; Fastify colon HTTP/WebSocket twins work, simulator has a string route, and Swagger contains exactly four unescaped literal paths.
 * @evidence contracts/testing.md#independent-expectations Authored router-specific escape spellings and literal echo handlers supply the handwritten payload/path expectations. Simulator checks only generated response shape, not an exact server value.
 * @evidence contracts/testing.md#distinguishing-cases Express backslash escapes versus Fastify double-colon, literal punctuation beside parameters, HTTP/WebSocket and simulator distinguish router interpretations. The document excludes WebSocket routes and asserts its exact HTTP set.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual SDK path printing, router matching, WebSocket upgrade and Swagger literal output must connect on both adapters; treating routes as filesystem paths cannot certify these transports.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
  try {
    await app.listen(0, "127.0.0.1");
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
