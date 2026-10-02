import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: MCP tools accept a single params object, not an
 * additional positional argument.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("extra_parameter")
  public async run(
    @core.McpRoute.Params() params: { value: string },
    extra: string,
  ): Promise<{ ok: boolean }> {
    void params;
    void extra;
    return { ok: true };
  }
}
