import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import {
  BadRequestException,
  HttpException,
  INestApplication,
} from "@nestjs/common";
import { NestContainer } from "@nestjs/core";
import { randomUUID } from "crypto";

import { IMcpRouteReflect } from "../decorators/internal/IMcpRouteReflect";

/**
 * MCP (Model Context Protocol) adaptor.
 *
 * `McpAdaptor` exposes every method decorated with {@link McpRoute} as an MCP
 * tool, reachable by LLM clients (Claude Desktop, Cursor, OpenAI function
 * calling, etc.) through a spec-compliant Streamable HTTP endpoint.
 *
 * At bootstrap the adaptor walks the {@link NestContainer}, collects every
 * controller method carrying `"nestia/McpRoute"` metadata, and caches a tool
 * registry. A fresh {@link McpServer} + {@link StreamableHTTPServerTransport}
 * pair is spun up per incoming HTTP request — the MCP-recommended pattern for
 * stateless mode, which lets multiple clients hit the endpoint concurrently
 * without sharing transport state.
 *
 * Typia-generated JSON Schemas flow through unchanged — the Zod-based
 * high-level registration API of `McpServer` is bypassed by accessing the
 * low-level `.server` handler.
 *
 * Error mapping follows the MCP specification:
 *
 * - Unknown tool name → JSON-RPC `-32601` ({@link ErrorCode.MethodNotFound}).
 * - Typia validation failure → JSON-RPC `-32602`
 *   ({@link ErrorCode.InvalidParams}) with structured diagnostics attached
 *   to `error.data.errors`.
 * - Handler throws {@link HttpException} → success response with
 *   `isError: true`, so the LLM can read the message and recover.
 * - Any other throw → JSON-RPC `-32603` ({@link ErrorCode.InternalError}).
 *
 * @example
 * ```typescript
 * import core from "@nestia/core";
 * import { NestFactory } from "@nestjs/core";
 *
 * const app = await NestFactory.create(AppModule);
 * await core.McpAdaptor.upgrade(app, { path: "/mcp" });
 * await app.listen(3000);
 * ```
 *
 * @author wildduck - https://github.com/wildduck2
 */
export class McpAdaptor {
  /**
   * Upgrade a running Nest application with an MCP endpoint.
   *
   * Scans the application container for methods decorated with
   * {@link McpRoute}, then registers a catch-all HTTP route at the configured
   * path. Each incoming request builds a fresh MCP server + transport on
   * demand, wires the registered tools into it, and delegates handling.
   *
   * Must be called after `NestFactory.create(...)` but before
   * `app.listen(...)` if you want the MCP endpoint to be reachable alongside
   * your regular HTTP routes.
   *
   * @param app Running Nest application instance.
   * @param options Transport and identity overrides.
   */
  public static async upgrade(
    app: INestApplication,
    options: McpAdaptor.IOptions = {},
  ): Promise<void> {
    const tools: McpAdaptor.ITool[] = [];
    const container = (app as any).container as NestContainer;
    for (const module of container.getModules().values()) {
      for (const wrapper of module.controllers.values()) {
        const instance = wrapper.instance;
        if (!instance) continue;
        const proto = Object.getPrototypeOf(instance);
        for (const key of Object.getOwnPropertyNames(proto)) {
          if (key === "constructor") continue;
          const method = proto[key];
          if (typeof method !== "function") continue;

          const meta: IMcpRouteReflect | undefined = Reflect.getMetadata(
            "nestia/McpRoute",
            method,
          );
          if (!meta) continue;

          const params: IMcpRouteReflect.IArgument[] =
            Reflect.getMetadata("nestia/McpRoute/Parameters", proto, key) ?? [];
          const paramValidator = params.find(
            (p) => p.category === "params",
          )?.validate;

          tools.push({
            meta,
            validateArgs: paramValidator,
            handler: async (args) => method.call(instance, args),
          });
        }
      }
    }

    const serverInfo = options.serverInfo ?? {
      name: "nestia-mcp",
      version: "1.0.0",
    };

    const http = app.getHttpAdapter();
    const route = options.path ?? "/mcp";
    http.all(route, async (req: any, res: any) => {
      // Fresh server + transport per request. Stateless mode requires
      // isolated transport state — sharing one across concurrent clients
      // races on internal `_initialized` flags and session tracking.
      const mcp = new McpServer(serverInfo, {
        capabilities: { tools: {} },
      });
      const server = mcp.server;

      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: tools.map((t) => ({
          name: t.meta.name,
          title: t.meta.title,
          description: t.meta.description,
          inputSchema: t.meta.inputSchema,
          outputSchema: t.meta.outputSchema,
          annotations: t.meta.annotations,
        })),
      }));

      server.setRequestHandler(CallToolRequestSchema, async (reqMsg) => {
        const tool = tools.find((t) => t.meta.name === reqMsg.params.name);
        if (!tool)
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool not found: ${reqMsg.params.name}`,
          );

        const args = reqMsg.params.arguments ?? {};
        if (tool.validateArgs) {
          const err: Error | null = tool.validateArgs(args);
          if (err !== null) {
            const body =
              err instanceof BadRequestException
                ? (err.getResponse() as any)
                : undefined;
            throw new McpError(ErrorCode.InvalidParams, err.message, {
              errors: body?.errors,
              path: body?.path,
              expected: body?.expected,
              value: body?.value,
              reason: body?.reason,
            });
          }
        }

        try {
          const result = await tool.handler(args);
          return {
            content: [
              {
                type: "text" as const,
                text:
                  typeof result === "string" ? result : JSON.stringify(result),
              },
            ],
          };
        } catch (e) {
          if (e instanceof HttpException) {
            return {
              content: [{ type: "text" as const, text: e.message }],
              isError: true,
            };
          }
          throw new McpError(
            ErrorCode.InternalError,
            e instanceof Error ? e.message : "Internal error",
          );
        }
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: options.sessioned ? () => randomUUID() : undefined,
        enableJsonResponse: true,
      });
      try {
        await mcp.connect(transport);
        await transport.handleRequest(
          req.raw ?? req,
          res.raw ?? res,
          req.body,
        );
      } finally {
        // Release SDK resources even if handleRequest throws.
        await transport.close().catch(() => {});
        await mcp.close().catch(() => {});
      }
    });
  }
}

export namespace McpAdaptor {
  /**
   * Configuration options for {@link McpAdaptor.upgrade}.
   */
  export interface IOptions {
    /**
     * HTTP path where the MCP endpoint will be mounted.
     *
     * @default "/mcp"
     */
    path?: string;

    /**
     * Identity advertised to MCP clients during the initialize handshake.
     * Shows up in Claude Desktop / Cursor's MCP panel.
     *
     * @default { name: "nestia-mcp", version: "1.0.0" }
     */
    serverInfo?: { name: string; version: string };

    /**
     * Enable session mode.
     *
     * When `true`, the transport issues an `Mcp-Session-Id` header on the
     * initialize response and requires it on every subsequent request. When
     * `false` (default), the server is stateless — simpler, covers the
     * common tool-server use case.
     *
     * @default false
     */
    sessioned?: boolean;
  }

  /**
   * @internal
   */
  export interface ITool {
    meta: IMcpRouteReflect;
    handler: (args: unknown) => Promise<unknown>;
    validateArgs?: (input: any) => Error | null;
  }
}
