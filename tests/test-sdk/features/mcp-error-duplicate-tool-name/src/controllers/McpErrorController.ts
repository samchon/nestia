import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: MCP tools are addressed by tool name, so duplicate
 * names would make dispatch ambiguous.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("duplicated_tool")
  public async first(
    @core.McpRoute.Params() params: { value: string },
  ): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }

  @core.McpRoute("duplicated_tool")
  public async second(
    @core.McpRoute.Params() params: { value: string },
  ): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }
}
