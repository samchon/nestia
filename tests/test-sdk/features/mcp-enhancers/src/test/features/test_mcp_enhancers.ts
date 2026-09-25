import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";
import { INestApplication } from "@nestjs/common";

import { Backend } from "../../Backend";

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
 */
export const test_mcp_enhancers = async (
  connection: IConnection,
): Promise<void> => {
  const fastify: INestApplication = await Backend.fastify();
  await fastify.listen(0, "127.0.0.1");
  try {
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
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${host}${path}`), {
        requestInit: { headers },
      }),
    );
    try {
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
    `${adapter} serves after the filter answered`,
    text(await call("open_tool", { value: "still" })),
    JSON.stringify({ value: "still" }),
  );
};
