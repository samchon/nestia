import {
  BadRequestException,
  HttpException,
  INestApplication,
} from "@nestjs/common";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";
import { ContextId, ContextIdFactory, NestContainer } from "@nestjs/core";
import { ExternalContextCreator } from "@nestjs/core/helpers/external-context-creator";
import { Injector } from "@nestjs/core/injector/injector";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";
import { REQUEST_CONTEXT_ID } from "@nestjs/core/router/request/request-constants";

import { IMcpRouteReflect } from "../decorators/internal/IMcpRouteReflect";

/**
 * MCP (Model Context Protocol) adaptor.
 *
 * `McpAdaptor` exposes every method decorated with {@link McpRoute} as an MCP
 * tool, reachable by LLM clients through a stateless Streamable HTTP endpoint.
 *
 * At bootstrap the adaptor walks the {@link NestContainer}, collects every
 * controller method carrying `"nestia/McpRoute"` metadata, and caches a tool
 * registry. A fresh MCP server and transport pair is spun up per incoming HTTP
 * request, following MCP stateless Streamable HTTP mode. This adaptor
 * intentionally does not manage `Mcp-Session-Id` state.
 *
 * Typia-generated JSON Schemas flow through unchanged; the Zod-based high-level
 * registration API of `McpServer` is bypassed by accessing the low-level
 * `.server` handler.
 *
 * A tool call passes the guards, interceptors, pipes, and exception filters
 * NestJS applies to an HTTP route on the same method, with the MCP HTTP request
 * as the execution context. The endpoint is mounted at `path` as given, outside
 * the application's global prefix.
 *
 * Error mapping follows the MCP specification:
 *
 * - Unknown tool name: JSON-RPC `-32601`.
 * - Typia validation failure: JSON-RPC `-32602` with structured diagnostics.
 * - Handler throws {@link HttpException}: success response with `isError: true`,
 *   so the LLM can read the message and recover.
 * - Any other throw: JSON-RPC `-32603`.
 *
 * @author wildduck - https://github.com/wildduck2
 * @example
 *   ```typescript
 *   import core from "@nestia/core";
 *   import { NestFactory } from "@nestjs/core";
 *
 *   const app = await NestFactory.create(AppModule);
 *   await core.McpAdaptor.upgrade(app, { path: "/mcp" });
 *   await app.listen(3000);
 *   ```;
 */
export class McpAdaptor {
  /**
   * Upgrade a running Nest application with a stateless MCP endpoint.
   *
   * Scans the application container for methods decorated with {@link McpRoute},
   * then registers a catch-all HTTP route at the configured path. Each incoming
   * request builds a fresh MCP server + transport on demand, wires the
   * registered tools into it, and delegates handling.
   *
   * Must be called after `NestFactory.create(...)` but before `app.listen(...)`
   * if you want the MCP endpoint to be reachable alongside your regular HTTP
   * routes.
   *
   * @param app Running Nest application instance.
   * @param options Transport and identity overrides.
   */
  public static async upgrade(
    app: INestApplication,
    options: McpAdaptor.IOptions = {},
  ): Promise<void> {
    if ("sessioned" in (options as Record<string, unknown>))
      throw new Error(
        "McpAdaptor.upgrade() supports stateless Streamable HTTP only; sessioned mode is not implemented.",
      );

    const tools: McpAdaptor.ITool[] = [];
    const container = (app as any).container as NestContainer;
    const injector: Injector = new Injector();
    for (const [moduleKey, module] of container.getModules()) {
      const creator: ExternalContextCreator =
        ExternalContextCreator.fromContainer(container);
      // it looks the module up among those providing the class, and a
      // controller is provided by none, so its enhancers would not resolve
      creator.getContextModuleKey = () => moduleKey;
      for (const wrapper of module.controllers.values()) {
        const instance = wrapper.instance;
        if (!instance) continue;
        const visited: Set<string> = new Set();
        for (
          let proto: any = Object.getPrototypeOf(instance);
          proto !== null && proto !== Object.prototype;
          proto = Object.getPrototypeOf(proto)
        ) {
          for (const key of Object.getOwnPropertyNames(proto)) {
            if (key === "constructor" || visited.has(key)) continue;
            visited.add(key);
            const method = proto[key];
            if (typeof method !== "function") continue;

            const meta: IMcpRouteReflect | undefined = Reflect.getMetadata(
              "nestia/McpRoute",
              method,
            );
            if (!meta) continue;

            const params: IMcpRouteReflect.IArgument[] =
              Reflect.getMetadata("nestia/McpRoute/Parameters", proto, key) ??
              [];
            tools.push({
              meta,
              source: `${wrapper.metatype?.name ?? proto.constructor?.name ?? "UnknownController"}.${String(key)}`,
              handler: createHandler({
                container,
                injector,
                creator,
                module,
                wrapper,
                key,
                argument: params.find((p) => p.category === "params"),
              }),
            });
          }
        }
      }
    }
    assertUniqueTools(tools);

    const serverInfo = options.serverInfo ?? {
      name: "nestia-mcp",
      version: "1.0.0",
    };
    const {
      CallToolRequestSchema,
      ErrorCode,
      ListToolsRequestSchema,
      McpError,
      McpServer,
      StreamableHTTPServerTransport,
    } = await loadMcpSdk();

    const http = app.getHttpAdapter();
    const route = options.path ?? "/mcp";
    http.all(route, async (req: any, res: any) => {
      // Stateless mode requires a fresh transport per request; sharing one
      // across clients races on internal initialization and request IDs.
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

      server.setRequestHandler(CallToolRequestSchema, async (reqMsg: any) => {
        const tool = tools.find((t) => t.meta.name === reqMsg.params.name);
        if (!tool)
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool not found: ${reqMsg.params.name}`,
          );

        const args = reqMsg.params.arguments ?? {};
        try {
          const result = await tool.handler({
            request: req,
            response: res,
            args,
          });
          if (tookOver(res)) return { content: [] };
          if (result instanceof Error) throw result;
          if (result === undefined) return { content: [] };
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
          if (tookOver(res)) return { content: [] };
          if (INVALID_ARGUMENTS.has(e as object)) {
            const body = (e as BadRequestException).getResponse() as any;
            throw new McpError(ErrorCode.InvalidParams, (e as Error).message, {
              errors: body?.errors,
              path: body?.path,
              expected: body?.expected,
              value: body?.value,
              reason: body?.reason,
            });
          }
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
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      try {
        await mcp.connect(transport);
        await transport.handleRequest(req.raw ?? req, res.raw ?? res, req.body);
      } finally {
        await transport.close().catch(() => {});
        await mcp.close().catch(() => {});
      }
    });
  }
}

/**
 * The tool's call through the enhancers NestJS applies to a route of the same
 * method: guards, interceptors, pipes, and exception filters, bound to the
 * method, its controller, or globally. The MCP HTTP request is the execution
 * context, so a guard reading `switchToHttp().getRequest()` works unchanged.
 *
 * The arguments reach the method through the pipes as its body would, validated
 * by typia at that stage: after the guards, as `@TypedBody()` is. An invalid
 * argument is thrown as the validator's `BadRequestException`, which an
 * exception filter may map; unmapped, it becomes JSON-RPC `-32602`.
 *
 * A controller that is request-scoped, itself or through an enhancer or a
 * dependency, is built per request with its enhancers, as NestJS builds it for
 * an HTTP route; the static instance is only a placeholder without them.
 */
const createHandler = (props: {
  container: NestContainer;
  injector: Injector;
  creator: ExternalContextCreator;
  module: Module;
  wrapper: InstanceWrapper;
  key: string;
  argument: IMcpRouteReflect.IArgument | undefined;
}): McpAdaptor.ITool["handler"] => {
  // the arguments stand at the params' position, or first when undecorated
  const index: number = props.argument?.index ?? 0;
  Reflect.defineMetadata(
    PARAMS_METADATA,
    { [`${RouteParamtypes.BODY}:${index}`]: { index, data: undefined } },
    props.wrapper.instance.constructor,
    props.key,
  );
  const validate = props.argument?.validate;
  const create = (instance: any, contextId?: ContextId) =>
    props.creator.create(
      instance,
      instance[props.key],
      props.key,
      PARAMS_METADATA,
      {
        // [request, response, next] as an HTTP route has, then the arguments
        exchangeKeyForValue: (_type, _data, [, , , args]) => {
          const error: Error | null = validate ? validate(args) : null;
          if (error === null) return args;
          INVALID_ARGUMENTS.add(error);
          throw error;
        },
      },
      contextId,
      contextId && props.wrapper.id,
    );
  let target: ((...args: any[]) => Promise<unknown>) | undefined;
  return async (input) => {
    const call = (fn: (...args: any[]) => Promise<unknown>) =>
      fn(input.request, input.response, undefined, input.args);
    // resolved at the first call, so global enhancers init() registers count
    if (props.wrapper.isDependencyTreeStatic())
      return call((target ??= create(props.wrapper.instance)));
    const contextId: ContextId = requestContextId(
      props.container,
      input.request as object,
      props.wrapper.isDependencyTreeDurable(),
    );
    const instance: object = await props.injector.loadPerContext(
      props.wrapper.instance,
      props.module,
      props.module.controllers,
      contextId,
    );
    return call(create(instance, contextId));
  };
};

/**
 * The context a request-scoped provider is built in for this request, the one
 * NestJS's router attaches to it, registering the request as `REQUEST`.
 */
const requestContextId = (
  container: NestContainer,
  request: any,
  durable: boolean,
): ContextId => {
  const contextId: ContextId = ContextIdFactory.getByRequest(request);
  if (!request[REQUEST_CONTEXT_ID]) {
    Object.defineProperty(request, REQUEST_CONTEXT_ID, {
      value: contextId,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    container.registerRequestProvider(
      durable ? contextId.payload : Object.assign(request, contextId.payload),
      contextId,
    );
  }
  return contextId;
};

/**
 * Whether an exception filter already wrote the HTTP response itself. The
 * response it wrote stands, so the transport's own is dropped: writing again
 * would throw, and the transport would destroy the connection mid-response.
 */
const tookOver = (response: any): boolean => {
  const raw: any = response.raw ?? response;
  if (raw.headersSent !== true) return false;
  raw.writeHead = () => raw;
  raw.flushHeaders = () => {};
  raw.write = () => true;
  raw.end = (...args: unknown[]) => {
    const callback: unknown = args.find((a) => typeof a === "function");
    if (typeof callback === "function") queueMicrotask(() => callback());
    return raw;
  };
  return true;
};

const PARAMS_METADATA = "nestia/McpRoute/ExternalParameters";

/** The validators' exceptions, told apart from a handler's own. */
const INVALID_ARGUMENTS: WeakSet<object> = new WeakSet();

const assertUniqueTools = (tools: McpAdaptor.ITool[]): void => {
  const dict: Map<string, McpAdaptor.ITool[]> = new Map();
  for (const tool of tools) {
    const array = dict.get(tool.meta.name) ?? [];
    array.push(tool);
    dict.set(tool.meta.name, array);
  }
  const duplicated = Array.from(dict.entries()).filter(
    ([, list]) => list.length > 1,
  );
  if (duplicated.length === 0) return;
  throw new Error(
    [
      "Duplicated MCP tool names are not allowed.",
      ...duplicated.map(
        ([name, list]) =>
          `  - ${JSON.stringify(name)}: ${list.map((tool) => tool.source).join(", ")}`,
      ),
    ].join("\n"),
  );
};

const loadMcpSdk = async () => {
  try {
    const [server, transport, types] = await Promise.all([
      import("@modelcontextprotocol/sdk/server/mcp.js"),
      import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
      import("@modelcontextprotocol/sdk/types.js"),
    ]);
    return {
      McpServer: server.McpServer,
      StreamableHTTPServerTransport: transport.StreamableHTTPServerTransport,
      CallToolRequestSchema: types.CallToolRequestSchema,
      ErrorCode: types.ErrorCode,
      ListToolsRequestSchema: types.ListToolsRequestSchema,
      McpError: types.McpError,
    };
  } catch {
    throw new Error(
      "McpAdaptor.upgrade() requires @modelcontextprotocol/sdk. Install it before enabling MCP routes.",
    );
  }
};

export namespace McpAdaptor {
  /** Configuration options for {@link McpAdaptor.upgrade}. */
  export interface IOptions {
    /**
     * HTTP path where the MCP endpoint will be mounted.
     *
     * @default "/mcp"
     */
    path?: string;

    /**
     * Identity advertised to MCP clients during the initialize handshake. Shows
     * up in Claude Desktop / Cursor's MCP panel.
     *
     * @default { name: "nestia-mcp", version: "1.0.0" }
     */
    serverInfo?: { name: string; version: string };
  }

  /** @internal */
  export interface ITool {
    meta: IMcpRouteReflect;
    source: string;
    handler: (input: {
      request: unknown;
      response: unknown;
      args: unknown;
    }) => Promise<unknown>;
  }
}
