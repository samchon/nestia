import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: an MCP tool and HTTP route must be separate methods so
 * SDK analysis cannot silently drop one protocol surface.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("mixed_http")
  @core.TypedRoute.Get("mixed-http")
  public async run(
    @core.McpRoute.Params() params: { value: string },
  ): Promise<{ ok: boolean }> {
    void params;
    return { ok: true };
  }
}
