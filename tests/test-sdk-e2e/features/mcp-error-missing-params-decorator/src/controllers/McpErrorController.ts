import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: the single MCP argument object must be explicitly
 * marked with `@McpRoute.Params()`.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("missing_params_decorator")
  public async run(params: { value: string }): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }
}
