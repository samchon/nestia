/**
 * Reflection metadata stored by the {@link McpRoute} decorator.
 *
 * Every method decorated with `@McpRoute()` carries an `IMcpRouteReflect`
 * object under the `"nestia/McpRoute"` key on its function value. The
 * {@link McpAdaptor} reads these at bootstrap to build the MCP tool
 * registry.
 *
 * @internal
 * @author wildduck - https://github.com/wildduck2
 */
export interface IMcpRouteReflect {
  name: string;
  title?: string;
  description?: string;
  inputSchema: object;
  outputSchema?: object;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

export namespace IMcpRouteReflect {
  /**
   * Per-parameter reflection entry stored under
   * `"nestia/McpRoute/Parameters"` on the owning prototype + property key.
   *
   * `validate` is the closure returned by `validate_request_body(...)` — at
   * runtime it either returns the validated input or throws
   * `BadRequestException`.
   *
   * @internal
   */
  export interface IArgument {
    category: "params";
    index: number;
    validate: (input: any) => any;
  }
}
