import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: MCP parameter types must not declare dynamic
 * properties. `Record<string, T>` and index-signature types must be rejected.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("param_dynamic_properties")
  public async run(
    @core.McpRoute.Params() params: Record<string, number>,
  ): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }
}
