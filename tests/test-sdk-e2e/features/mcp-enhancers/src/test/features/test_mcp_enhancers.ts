import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";
import { INestApplication } from "@nestjs/common";

import { Backend } from "../../Backend";
import { TeapotFilter } from "../../controllers/EnhancedController";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies an MCP tool call passes the enhancers NestJS applies to the same
 * controller method, with the MCP HTTP request as its execution context, on
 * Express and on Fastify.
 *
 * `McpAdaptor` called the method directly, so a guarded controller served its
 * tools to anyone, and no interceptor, pipe, or exception filter ran (#1703).
 *
 * 1. On the harness's Express application and on a Fastify one, call tools guarded
 *    by a deny guard on the controller and on the method, an allow guard, no
 *    guard, a guard reading `Authorization`, and a global `APP_GUARD`; assert
 *    the denied fail as tool errors while the same HTTP route answers 403.
 * 2. Assert a guard runs before argument validation, which still answers
 *    `InvalidParams` once the guards pass.
 * 3. Assert an interceptor wraps the call, a pipe transforms the arguments, a
 *    filter's mapped exception is the tool error, and a filter answering the
 *    HTTP request itself is what the client receives, the server still
 *    serving.
 *
 * @evidence contracts/testing.md#behavioral-verification Both Express/Fastify must enforce controller/method/global/request-scoped/bearer guards, run guards before validation, apply interceptor/uppercase pipe/mapped filter, surface teapot418, retain the raw response method identities after transport continuation, and remain serving afterward with the exact retained messages/echoes.
 * @evidence contracts/testing.md#independent-expectations Authored enhancer classes explicitly deny/allow, read request headers, append intercepted, uppercase values, map conflict and send teapot JSON. Those literal operations plus official InvalidParams independently establish each expected result.
 * @evidence contracts/testing.md#distinguishing-cases Allowed/denied/no-guard and missing/present headers, request scope, invalid args before/after guards, interceptor/pipe and throwing/responding filters contrast enhancer order and lifecycle on both adapters. The responding filter captures original raw methods and observes them after close and a task turn, distinguishing response mutation from an owned transport facade.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual Nest enhancer resolution/request context and MCP HTTP adaptor must share the controller lifecycle. Direct method invocation or portable guard evaluation cannot prove this assembly.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_enhancers = async (
  connection: IConnection,
): Promise<void> => {
  const fastify: INestApplication = await Backend.fastify();
  try {
    await fastify.listen(0, "127.0.0.1");
    for (const [adapter, host] of [
      ["express", connection.host],
      ["fastify", (await fastify.getUrl()).replace("[::1]", "127.0.0.1")],
    ] as const)
      await validate(adapter, host, connection.path);
  } finally {
    await fastify.close();
  }
};

const validate = async (
  adapter: string,
  host: string,
  path: string,
): Promise<void> => {
  const call = async (
    name: string,
    args: object,
    headers: Record<string, string> = {},
  ): Promise<any> => {
    const client = new Client({ name: "nestia-test", version: "1.0.0" });
    try {
      await client.connect(
        new StreamableHTTPClientTransport(new URL(`${host}${path}`), {
          requestInit: { headers },
        }),
      );
      return await client.callTool({ name, arguments: args as any });
    } finally {
      await client.close();
    }
  };
  const denied = async (
    title: string,
    result: any,
    message: string,
  ): Promise<void> => {
    TestValidator.equals(`${adapter} ${title} isError`, result.isError, true);
    TestValidator.equals(
      `${adapter} ${title} message`,
      result.content?.[0]?.text,
      message,
    );
  };
  const text = (result: any): string | undefined =>
    result.isError === true ? undefined : result.content?.[0]?.text;

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
  await denied(
    "controller guard",
    await call("guarded_tool", { value: "through" }),
    "Forbidden resource",
  );
  await denied(
    "method guard",
    await call("denied_tool", { value: "through" }),
    "Forbidden resource",
  );
  TestValidator.equals(
    `${adapter} allow guard`,
    text(await call("allowed_tool", { value: "allowed" })),
    JSON.stringify({ value: "allowed" }),
  );
  TestValidator.equals(
    `${adapter} no guard`,
    text(await call("open_tool", { value: "open" })),
    JSON.stringify({ value: "open" }),
  );
  await denied(
    "bearer missing",
    await call("bearer_tool", { value: "x" }),
    "bearer token required",
  );
  TestValidator.equals(
    `${adapter} bearer`,
    text(
      await call(
        "bearer_tool",
        { value: "x" },
        { authorization: "Bearer secret" },
      ),
    ),
    JSON.stringify({ value: "x" }),
  );
  await denied(
    "global guard",
    await call("open_tool", { value: "open" }, { "x-deny": "1" }),
    "Forbidden resource",
  );

  // request-scoped enhancers and controllers, resolved per request
  TestValidator.equals(
    `${adapter} scoped guard http`,
    (await fetch(`${host}/scoped-guard`)).status,
    403,
  );
  await denied(
    "request-scoped guard",
    await call("scoped_guard_tool", { value: "through" }),
    "Forbidden resource",
  );
  TestValidator.equals(
    `${adapter} request-scoped guard passing`,
    text(await call("scoped_guard_tool", { value: "pass" }, { "x-pass": "1" })),
    JSON.stringify({ value: "pass" }),
  );
  TestValidator.equals(
    `${adapter} request-scoped controller`,
    text(await call("scoped_tool", { value: "v" }, { "x-name": "nestia" })),
    JSON.stringify({ value: "v:nestia" }),
  );

  // a guard runs before validation, which still answers once they pass
  await denied(
    "guard before validation",
    await call("denied_tool", { value: 3 }),
    "Forbidden resource",
  );
  const invalid: unknown = await call("open_tool", { value: 3 }).catch(
    (e) => e,
  );
  TestValidator.predicate(
    `${adapter} invalid arguments`,
    invalid instanceof McpError && invalid.code === ErrorCode.InvalidParams,
  );

  // interceptors, pipes, and filters
  TestValidator.equals(
    `${adapter} interceptor`,
    text(await call("intercepted_tool", { value: "v" })),
    JSON.stringify({ value: "v:intercepted" }),
  );
  TestValidator.equals(
    `${adapter} pipe`,
    text(await call("piped_tool", { value: "lower" })),
    JSON.stringify({ value: "LOWER" }),
  );
  await denied(
    "mapping filter",
    await call("domain_tool", { value: "conflict" }),
    "mapped: conflict",
  );
  const teapot: unknown = await call("teapot_tool", { value: "tea" }).catch(
    (e) => e,
  );
  TestValidator.predicate(
    `${adapter} answering filter ${String(teapot)}`,
    teapot instanceof Error &&
      (teapot as Error & { code?: unknown }).code === 418 &&
      teapot.message.includes(JSON.stringify({ teapot: "tea" })),
  );
  TestValidator.equals(
    `${adapter} foreign response methods preserved`,
    await TeapotFilter.methodsPreserved,
    true,
  );
  TestValidator.equals(
    `${adapter} serves after the filter answered`,
    text(await call("open_tool", { value: "still" })),
    JSON.stringify({ value: "still" }),
  );
};
