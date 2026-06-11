import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: every MCP tool must expose exactly one
 * `@McpRoute.Params()` argument object.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("no_params")
  public async run(): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
