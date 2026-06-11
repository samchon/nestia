import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: distinct MCP tool names must not collapse to the same
 * generated SDK accessor after identifier escaping.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("same-name")
  public async first(
    @core.McpRoute.Params() params: { value: string },
  ): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }

  @core.McpRoute("same_name")
  public async second(
    @core.McpRoute.Params() params: { value: string },
  ): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }
}
