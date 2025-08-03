import {
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Body,
} from "@nestjs/common";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * MCP (Model Context Protocol) route decorator.
 *
 * `@McpRoute` is a decorator for creating MCP-compatible tool endpoints that
 * can be called by LLMs (Large Language Models) through the Model Context Protocol.
 * It provides type-safe parameter validation and automatic schema generation
 * for tool discovery.
 *
 * The decorator automatically handles MCP protocol messages including:
 * - `list_tools`: Returns available tools with their schemas
 * - `call_tool`: Executes a specific tool with parameters
 *
 * @param config Configuration for the MCP tool
 * @returns Method decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function McpRoute(config: McpRoute.IConfig): MethodDecorator {
  return function McpRoute(
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> {
    // Store metadata for reflection
    Reflect.defineMetadata(
      "nestia/McpRoute",
      {
        name: config.name,
        description: config.description,
        inputSchema: config.inputSchema,
      } satisfies McpRoute.IMcpRouteReflect,
      descriptor.value,
    );
    return descriptor;
  };
}

export namespace McpRoute {
  /**
   * Configuration for MCP route.
   */
  export interface IConfig {
    /**
     * Unique name identifier for the tool.
     */
    name: string;

    /**
     * Human-readable description of what the tool does.
     */
    description: string;

    /**
     * JSON schema for the tool's input parameters.
     * If not provided, will be auto-generated from TypeScript types.
     */
    inputSchema?: object;
  }

  /**
   * Metadata stored for MCP route reflection.
   * @internal
   */
  export interface IMcpRouteReflect {
    name: string;
    description: string;
    inputSchema?: object;
  }

  /**
   * Standard MCP error response.
   */
  export interface IMcpError {
    code: number;
    message: string;
    data?: unknown;
  }

  /**
   * Standard MCP tool result.
   */
  export interface IMcpToolResult {
    content: Array<{
      type: "text";
      text: string;
    }>;
    isError?: boolean;
  }

  /**
   * MCP tool call request.
   */
  export interface IMcpToolCall {
    name: string;
    arguments?: Record<string, unknown>;
  }

  /**
   * MCP tool definition for list_tools response.
   */
  export interface IMcpTool {
    name: string;
    description: string;
    inputSchema: object;
  }

  /**
   * Parameter metadata for reflection.
   * @internal
   */
  export interface IMcpParamReflect {
    category: "params";
    index: number;
    validate: (input: any) => any;
  }

  /**
   * Parameter decorator for MCP tool parameters.
   *
   * `@McpRoute.Params()` validates and extracts parameters from MCP tool calls
   * with type safety through typia.
   */
  export function Params<T>(
    validator?: IRequestBodyValidator<T>,
  ): ParameterDecorator {
    const validate = validate_request_body("McpRoute.Params")(validator);
    return function McpParams(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      const array: McpRoute.IMcpParamReflect[] | undefined = Reflect.getMetadata(
        "nestia/McpRoute/Parameters",
        target,
        propertyKey ?? "",
      );
      const value: McpRoute.IMcpParamReflect = {
        category: "params",
        index: parameterIndex,
        validate,
      };
      if (array !== undefined) array.push(value);
      else
        Reflect.defineMetadata(
          "nestia/McpRoute/Parameters",
          [value],
          target,
          propertyKey ?? "",
        );
    };
  }
}

/**
 * Base controller providing MCP protocol endpoints.
 * 
 * This function creates a controller class that automatically provides:
 * - POST /tools - List available MCP tools
 * - POST /call - Call a specific MCP tool
 */
export function McpController(prefix: string = "mcp") {
  @Controller(prefix)
  class McpControllerBase {
    /**
     * List all available MCP tools.
     */
    @Post("tools")
    public async listTools(): Promise<{ tools: McpRoute.IMcpTool[] }> {
      const tools: McpRoute.IMcpTool[] = [];
      const prototype = Object.getPrototypeOf(this);
      
      // Walk the prototype chain to find all MCP routes
      let current = prototype;
      while (current && current !== Object.prototype) {
        const propertyNames = Object.getOwnPropertyNames(current);
        for (const propertyName of propertyNames) {
          if (propertyName === "constructor") continue;

          const method = current[propertyName];
          if (typeof method !== "function") continue;

          const mcpConfig: McpRoute.IMcpRouteReflect | undefined =
            Reflect.getMetadata("nestia/McpRoute", method);

          if (mcpConfig) {
            tools.push({
              name: mcpConfig.name,
              description: mcpConfig.description,
              inputSchema: mcpConfig.inputSchema || {
                type: "object",
                properties: {},
              },
            });
          }
        }
        current = Object.getPrototypeOf(current);
      }

      return { tools };
    }

    /**
     * Call a specific MCP tool.
     */
    @Post("call")
    public async callTool(
      @Body() request: McpRoute.IMcpToolCall,
    ): Promise<McpRoute.IMcpToolResult> {
      let current = Object.getPrototypeOf(this);
      
      // Walk the prototype chain to find the tool
      while (current && current !== Object.prototype) {
        const propertyNames = Object.getOwnPropertyNames(current);
        for (const propertyName of propertyNames) {
          if (propertyName === "constructor") continue;

          const method = current[propertyName];
          if (typeof method !== "function") continue;

          const mcpConfig: McpRoute.IMcpRouteReflect | undefined =
            Reflect.getMetadata("nestia/McpRoute", method);

          if (mcpConfig && mcpConfig.name === request.name) {
            try {
              // Pass the arguments directly as the first parameter
              const result = await method.apply(this, [request.arguments || {}]);
              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify(result),
                  },
                ],
              };
            } catch (error) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  },
                ],
                isError: true,
              };
            }
          }
        }
        current = Object.getPrototypeOf(current);
      }

      throw new HttpException(
        {
          code: -32601,
          message: `Tool not found: ${request.name}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  return McpControllerBase;
}