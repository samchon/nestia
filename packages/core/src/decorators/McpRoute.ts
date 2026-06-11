import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { IMcpRouteReflect } from "./internal/IMcpRouteReflect";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * MCP (Model Context Protocol) route decorator.
 *
 * `@McpRoute()` marks a controller method as a callable MCP tool. When the
 * application bootstraps, every method annotated with this decorator is
 * registered on the MCP server built by {@link McpAdaptor.upgrade}, making it
 * reachable by LLM clients (Claude Desktop, Cursor, OpenAI function calling,
 * etc.) through the standard Streamable HTTP transport.
 *
 * The public form takes only the tool's `name` (string). Human-readable
 * `description` and `title` are read from the method's JSDoc:
 *
 * - `description`: the JSDoc comment body.
 * - `title`: the value of an optional `@title` JSDoc tag.
 *
 * For type-safe tool inputs, decorate exactly one parameter of the method with
 * {@link McpRoute.Params}. The parameter type `T` is analyzed at compile time by
 * the nestia transformer, which generates both a runtime validator (powered by
 * typia) and the JSON Schema attached to `inputSchema` in `tools/list`
 * responses.
 *
 * For the MCP endpoint to actually be served, you must call
 * {@link McpAdaptor.upgrade} on the {@link INestApplication} instance at
 * bootstrap. The decorator alone only stores reflection metadata.
 *
 * @author wildduck - https://github.com/wildduck2
 * @example
 *   ```typescript
 *   import core from "@nestia/core";
 *
 *   @Controller()
 *   export class WeatherController {
 *     /**
 *      * Return current weather for a city.
 *      *
 *      * @title Get weather
 *      *\/
 *     @core.McpRoute("get_weather")
 *     public async get(
 *       @core.McpRoute.Params() params: { city: string },
 *     ): Promise<{ temp: number }> {
 *       return { temp: 22 };
 *     }
 *   }
 *   ```;
 *
 * @param name Unique tool identifier exposed to MCP clients via `tools/list`.
 * @returns Method decorator.
 */
export function McpRoute(name: string): MethodDecorator;

/** @internal */
export function McpRoute(config: McpRoute.IConfig): MethodDecorator;

export function McpRoute(input: string | McpRoute.IConfig): MethodDecorator {
  const config: McpRoute.IConfig =
    typeof input === "string" ? { name: input } : input;
  return function McpRoute(
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> {
    Reflect.defineMetadata(
      "nestia/McpRoute",
      {
        name: config.name,
        title: config.title,
        description: config.description,
        inputSchema: config.inputSchema ?? { type: "object", properties: {} },
        outputSchema: config.outputSchema,
        annotations: config.annotations,
      } satisfies IMcpRouteReflect,
      descriptor.value,
    );
    return descriptor;
  };
}

export namespace McpRoute {
  /**
   * Configuration object emitted by the nestia transformer at compile time.
   *
   * Users do not write this directly; they call `@McpRoute("name")` and the
   * transformer rewrites the call to `@McpRoute({ name, description, title,
   * inputSchema, ... })` after parsing the method's JSDoc and analyzing the
   * `@McpRoute.Params<T>()` parameter type.
   *
   * @internal
   */
  export interface IConfig {
    name: string;
    title?: string;
    description?: string;
    inputSchema?: object;
    outputSchema?: object;
    annotations?: IMcpRouteReflect["annotations"];
  }

  /**
   * Parameter decorator for an MCP tool's input arguments.
   *
   * `@McpRoute.Params<T>()` validates the `arguments` object from a
   * `tools/call` request against the TypeScript type `T` using typia. A failed
   * validation surfaces to the client as a JSON-RPC `-32602` (`InvalidParams`)
   * error with structured diagnostics, giving the LLM precise feedback to
   * self-correct.
   *
   * MCP tools accept exactly one arguments object; applying this decorator more
   * than once on a single method is a compile-time error. The decorated type
   * `T` must be an object type without dynamic properties (no `Record<string,
   * X>`, no index signatures); the nestia transformer enforces this through
   * `LlmSchemaProgrammer.validate`.
   *
   * @author wildduck - https://github.com/wildduck2
   * @param validator Optional custom validator. Default is `typia.assert()`.
   * @returns Parameter decorator.
   */
  export function Params<T>(
    validator?: IRequestBodyValidator<T>,
  ): ParameterDecorator {
    const validate = validate_request_body("McpRoute.Params")(validator);
    return function McpRouteParams(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      emplace(target, propertyKey ?? "", {
        category: "params",
        index: parameterIndex,
        validate,
      });
    };
  }

  /** @internal */
  const emplace = (
    target: Object,
    propertyKey: string | symbol,
    value: IMcpRouteReflect.IArgument,
  ) => {
    const array: IMcpRouteReflect.IArgument[] | undefined = Reflect.getMetadata(
      "nestia/McpRoute/Parameters",
      target,
      propertyKey,
    );
    if (array !== undefined) array.push(value);
    else
      Reflect.defineMetadata(
        "nestia/McpRoute/Parameters",
        [value],
        target,
        propertyKey,
      );
  };
}
